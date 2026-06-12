"use client";

import { type MouseEvent, useRef } from "react";

interface SelectableHeroTitleProps {
  className?: string;
  text: string;
}

export function SelectableHeroTitle({
  className = "",
  text,
}: SelectableHeroTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  function selectTitleText(event: MouseEvent<HTMLHeadingElement>) {
    const title = titleRef.current;
    const selection = window.getSelection();

    if (!title || !selection) {
      return;
    }

    event.preventDefault();

    const range = document.createRange();
    range.selectNodeContents(title);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return (
    <h1
      ref={titleRef}
      className={className}
      data-text={text}
      onClick={selectTitleText}
    >
      {text}
    </h1>
  );
}
