import { screen } from "__support__/ui";

import type { SetupOpts } from "./setup";
import { setup as baseSetup } from "./setup";

function setup(opts: SetupOpts) {
  baseSetup({ hasEnterprisePlugins: true, ...opts });
}

describe("DashCardParameterMapper > DisabledNativeCardHelpText (EE without token)", () => {
  it("should show a help link when `show-metabase-links: true`", () => {
    setup({ showMetabaseLinks: true });

    expect(
      screen.getByText(
        "A text variable in this card can only be connected to a text filter with Is operator.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Learn how")).toBeInTheDocument();
  });

  it("should show a help link when `show-metabase-links: false`", () => {
    setup({ showMetabaseLinks: false });

    expect(
      screen.getByText(
        "A text variable in this card can only be connected to a text filter with Is operator.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Learn how")).toBeInTheDocument();
  });
});
