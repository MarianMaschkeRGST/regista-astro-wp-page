import {
  getBlockStyling as getWpBlockStyling,
  parseVariable,
  type Block,
} from "@wp-block-tools/styles";

// The library reads alignment from the pre-WP 6.6 `attributes.textAlign`, so
// mirror WordPress' current location onto it to get the text-* class back.
// The legacy attribute can still hold an unrelated width value ("full", "wide"),
// so the typography setting always wins rather than deferring to it.
const withTextAlign = (block: Block): Block => {
  const textAlign = block.attributes?.style?.typography?.textAlign;
  if (!textAlign || textAlign === block.attributes?.textAlign) return block;
  return { ...block, attributes: { ...block.attributes, textAlign } };
};

// Font family is dropped by the library in both of its locations: as a literal
// value, and as a theme preset slug. parseVariable handles the `var:preset|…` form.
const getFontFamily = (block: Block) => {
  const value = block.attributes?.style?.typography?.fontFamily;
  if (value) return parseVariable(value);

  const slug = block.attributes?.fontFamily;
  return slug ? `var(--font-family--${slug})` : undefined;
};

/**
 * `getBlockStyling` from @wp-block-tools/styles, with the two typography
 * settings it drops — text alignment and font family — put back, so what the
 * WordPress editor sets is what renders.
 */
export const getBlockStyling = (block: Block) => {
  const { styles, classes } = getWpBlockStyling(withTextAlign(block));
  const fontFamily = getFontFamily(block);
  const declarations = [styles];
  if (fontFamily) declarations.push(`font-family: ${fontFamily}`);

  return { classes, styles: declarations.filter(Boolean).join(";") };
};
