import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatComposer } from "./chat-composer";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function renderStreaming() {
  const onStop = vi.fn();
  render(
    <ChatComposer
      canSubmit
      isStreaming
      isSubmitting={false}
      message=""
      onBlur={vi.fn()}
      onChange={vi.fn()}
      onResumeRequest={vi.fn()}
      onStop={onStop}
      onSubmit={vi.fn()}
    />,
  );
  return onStop;
}

describe("ChatComposer Escape", () => {
  it("stops the reply", () => {
    const onStop = renderStreaming();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  /* Each of these closes on its own Escape listener without preventDefault. */
  it("leaves it to Streamdown's link modal when that is open", () => {
    const onStop = renderStreaming();
    const modal = document.createElement("div");
    modal.dataset.streamdown = "link-safety-modal";
    document.body.append(modal);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onStop).not.toHaveBeenCalled();
  });

  it("leaves it to an open menu", () => {
    const onStop = renderStreaming();
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    const item = document.createElement("button");
    menu.append(item);
    document.body.append(menu);
    item.focus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onStop).not.toHaveBeenCalled();
  });

  it("leaves it to an IME composition", () => {
    const onStop = renderStreaming();
    fireEvent.keyDown(document, { isComposing: true, key: "Escape" });
    expect(onStop).not.toHaveBeenCalled();
  });
});
