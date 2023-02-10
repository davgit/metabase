(ns metabase.query-processor.middleware.cache-backend.serialization
  (:require
   [buddy.core.codecs :as codecs]
   [clojure.java.io :as io]
   [clojure.tools.logging :as log]
   [clojure.tools.reader.edn :as edn]
   [clojure.walk :as walk]
   [flatland.ordered.map :as ordered-map]
   [metabase.public-settings :as public-settings]
   [metabase.query-processor.middleware.cache-backend.interface :as i]
   [metabase.util :as u]
   [metabase.util.i18n :refer [trs]]
   [taoensso.nippy :as nippy])
  (:import
   (java.io
    BufferedInputStream
    BufferedOutputStream
    ByteArrayInputStream
    ByteArrayOutputStream
    DataInputStream
    DataOutputStream
    EOFException
    FilterOutputStream
    InputStream
    OutputStream)
   (java.util.zip GZIPInputStream GZIPOutputStream)))

(defn- max-bytes-output-stream ^OutputStream
  [max-bytes ^OutputStream os]
  (let [byte-count  (atom 0)
        check-total (fn [current-total]
                      (when (> current-total max-bytes)
                        (log/info (trs "Results are too large to cache.") (u/emoji "😫"))
                        (throw (ex-info (trs "Results are too large to cache.") {:type ::max-bytes}))))]
    (proxy [FilterOutputStream] [os]
      (write
        ([x]
         (if (int? x)
           (do
             (check-total (swap! byte-count inc))
             (.write os ^int x))
           (do
             (check-total (swap! byte-count + (alength ^bytes x)))
             (.write os ^bytes x))))

        ([^bytes ba ^Integer off ^Integer len]
         (check-total (swap! byte-count + len))
         (.write os ba off len))))))

;; flatland.ordered.map.OrderedMap gets encoded and decoded incorrectly, for some reason. See #25915

(nippy/extend-freeze flatland.ordered.map.OrderedMap :flatland/ordered-map
                     [x data-output]
                     (nippy/freeze-to-out! data-output (vec x)))

(nippy/extend-thaw :flatland/ordered-map
                   [data-input]
                   (ordered-map/ordered-map-reader (nippy/thaw-from-in! data-input)))

(defn- freeze!
  [^OutputStream os obj]
  (log/tracef "Freezing %s" (pr-str obj))
  (nippy/freeze-to-out! os obj)
  (.flush os))

(defn- thaw!
  [^InputStream is]
  (try
    (nippy/thaw-from-in! is)
    (catch EOFException _e
      ::eof)))

(defn- reducible-rows
  [^InputStream is]
  (reify clojure.lang.IReduceInit
    (reduce [_ rf init]
      (loop [acc init]
        ;; NORMALLY we would be checking whether `acc` is `reduced?` here and stop reading from the database if it was,
        ;; but since we currently store the final metadata at the very end of the database entry as a special pseudo-row
        ;; we actually have to keep reading the whole thing until we get to that last result. Don't worry, the reducing
        ;; functions can just throw out everything we don't need. See
        ;; [[metabase.query-processor.middleware.cache/cache-version]] for a description of our caching format.
        (let [row (thaw! is)]
          (if (= row ::eof)
            acc
            (recur (rf acc row))))))))

(def nippy-bounded-serializer
  "Nippy serializer. GZipped and frozen, bounded by size."
  (reify
    i/Ser
    (-get-accumulator [_ options]
      (let [os (ByteArrayOutputStream.)
            max-bytes (:max-bytes options (* (public-settings/query-caching-max-kb) 1024))
            gzipping-os  (-> (max-bytes-output-stream max-bytes os)
                             BufferedOutputStream.
                             (GZIPOutputStream. true)
                             DataOutputStream.)
            finalizer (fn nippy-finalizer []
                        (let [bytes (.toByteArray os)]
                          (u/ignore-exceptions (.close gzipping-os))
                          (u/ignore-exceptions (.close os))
                          bytes))]
        [gzipping-os finalizer]))
    (-add! [_ gzipping-os obj]
      (freeze! gzipping-os obj))
    (-options [_] {:max-bytes (* (public-settings/query-caching-max-kb) 1024)})
    (-name [_] "v3-nippy-bounded-serializer")

    i/Des
    (-metadata-and-reducible-rows [_ is f]
      (with-open [is' (DataInputStream. (GZIPInputStream. (BufferedInputStream. is)))]
        (let [metadata (thaw! is')]
          (if (= metadata ::eof) ;; v3 is here: metadata is first
            (f nil)
            (f [metadata (reducible-rows is')])))))))


(def unbounded-edn-serializer
  "Unbounded edn serializer."
  (let [eof      (Object.)
        read-edn (fn read-edn [pbr]
                   (edn/read {:eof eof, :readers *data-readers*} pbr))]
    (reify
      i/Ser
      (-get-accumulator [_ _options]
        (let [os (ByteArrayOutputStream.)
              buffered (BufferedOutputStream. os)
              finalizer (fn edn-serializer-finalizer []
                          (.toByteArray os))]
          [buffered finalizer]))
      (-add! [_ os obj]
        (let [bytes (.getBytes (pr-str (walk/postwalk #(if (record? %) (into {} %) %) obj)))]
          (.write os bytes 0 (count bytes))
          (.write os (.getBytes " ") 0 (count (.getBytes " ")))
          (.flush os)))
      (-options [_] {})
      (-name [_] "v3-unbounded-edn-serializer")

      i/Des
      (-metadata-and-reducible-rows [_ is f]
        (with-open [rdr (io/reader is)
                    pbr (java.io.PushbackReader. rdr)]
          (let [metadata (read-edn pbr)]
            (if (= metadata eof)
              (f nil)
              (f [metadata (reify clojure.lang.IReduceInit
                             (reduce [_ rf init]
                               (loop [acc init]
                                 (let [row (read-edn pbr)]
                                   (if (= row eof)
                                     acc
                                     (let [result (rf acc row)]
                                       (if (reduced? result)
                                         @result
                                         (recur result))))))))]))))))))

(defonce in-memory-cache (atom {}))

(comment
  (reset! in-memory-cache {})
  @in-memory-cache
  (instance? (Class/forName "[B") (:results (val (first @in-memory-cache)))))

(defmethod i/cache-backend :atom
  [_]
  (reify
    i/CacheBackend
    (cached-results [_ query-hash _max-age respond]
      (let [entry (@in-memory-cache (codecs/bytes->hex query-hash))]
        (if (instance? (Class/forName "[B") (:results (val (first @in-memory-cache))))
          (with-open [is (ByteArrayInputStream. (:results (val (first @in-memory-cache))))]
            (respond (assoc entry :results is)))
          (respond entry))))
    (save-results! [_ query-hash in serializer-name]
      (swap! in-memory-cache assoc (codecs/bytes->hex query-hash)
             {:results in
              :serializer serializer-name}))
    (purge-old-entries! [_ _max-age-seconds]
      nil)))

(def in-memory-cache-serializer
  "Can only be used with the `:atom` backend. The db backend needs bytes to serialize."
  (reify
    i/Ser
    (-get-accumulator [_ _options]
      (let [acc (atom [])]
        [acc (fn [] (deref acc))]))
    (-add! [_ a obj]
      (swap! a conj obj))
    (-options [_] {})
    (-name [_] "in-memory-cache-serializer")

    i/Des
    (-metadata-and-reducible-rows [_ in f]
      (let [metadata (first in)]
        (if (= metadata nil)
          (f nil)
          (f [metadata (rest in)]))))))
