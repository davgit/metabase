(ns metabase.query-processor.util.transformations.nest-breakouts-test
  (:require
   [clojure.test :refer :all]
   [metabase.lib.core :as lib]
   [metabase.lib.metadata :as lib.metadata]
   [metabase.lib.test-metadata :as meta]
   [metabase.query-processor.util.transformations.nest-breakouts :as nest-breakouts]))

(deftest ^:parallel cumulative-aggregation-with-filter-and-temporal-bucketed-breakout-test
  (testing "Query with a filter and a temporally bucketed breakout should work (#41791)"
    (let [orders            (meta/table-metadata :orders)
          orders-quantity   (meta/field-metadata :orders :quantity)
          orders-created-at (meta/field-metadata :orders :created-at)
          orders-id         (meta/field-metadata :orders :id)
          query             (-> (lib/query meta/metadata-provider orders)
                                (lib/filter (lib/> orders-id 0))
                                (lib/aggregate (lib/cum-count))
                                (lib/breakout (lib/with-temporal-bucket orders-created-at :month))
                                (lib/breakout orders-quantity)
                                (lib/limit 5))]
      (is (=? {:stages [{:filters [[:> {} [:field {} (meta/id :orders :id)] 0]]
                         :fields [[:field {:temporal-unit :month} (meta/id :orders :created-at)]
                                  [:field {} (meta/id :orders :quantity)]]}
                        {:breakout    [[:field {:temporal-unit :default} "CREATED_AT"]
                                       [:field {} "QUANTITY"]]
                         :aggregation [[:cum-count {}]]
                         :limit 5}]}
              (nest-breakouts/nest-breakouts-in-stages-with-window-aggregation query))))))

(deftest ^:parallel nest-breakouts-test
  (let [metadata-provider meta/metadata-provider
        orders            (lib.metadata/table metadata-provider (meta/id :orders))
        orders-created-at (lib.metadata/field metadata-provider (meta/id :orders :created-at))
        orders-total      (lib.metadata/field metadata-provider (meta/id :orders :total))
        query             (-> (lib/query metadata-provider orders)
                              (lib/breakout (lib/with-temporal-bucket orders-created-at :month))
                              (lib/aggregate (lib// (lib/cum-sum (lib/+ orders-total 1))
                                                    (lib/cum-count)))
                              (lib/limit 3))]
    (is (=? {:stages [{:source-table (meta/id :orders)
                       :breakout     [[:field
                                       {:base-type      :type/DateTimeWithLocalTZ
                                        :effective-type :type/DateTimeWithLocalTZ
                                        :temporal-unit  :month}
                                       (meta/id :orders :created-at)]]
                       :aggregation  [[:/ {}
                                       [:cum-sum {}
                                        [:+ {}
                                         [:field {} (meta/id :orders :total)]
                                         1]]
                                       [:cum-count {}]]]
                       :limit        3}]}
            query))
    (is (=? (sort-by last [[:field {} (meta/id :orders :total)]
                           [:field {:temporal-unit :month} (meta/id :orders :created-at)]])
            (sort-by last
                     (#'nest-breakouts/fields-used-in-breakouts-aggregations-or-expressions
                      (first (:stages query))))))
    (is (=? {:stages [{:source-table (meta/id :orders)
                       :fields       [[:field
                                       {:base-type      :type/DateTimeWithLocalTZ
                                        :effective-type :type/DateTimeWithLocalTZ
                                        :temporal-unit  :month}
                                       (meta/id :orders :created-at)]
                                      [:field {} (meta/id :orders :total)]]}
                      {:breakout    [[:field {:temporal-unit :default} "CREATED_AT"]]
                       :aggregation [[:/ {}
                                      [:cum-sum {}
                                       [:+ {}
                                        [:field {} "TOTAL"]
                                        1]]
                                      [:cum-count {}]]]
                       :limit       3}]}
            (nest-breakouts/nest-breakouts-in-stages-with-window-aggregation query)))))
