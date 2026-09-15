/** Marks AI-generated text, so it is never mistaken for Regista's own words. */
export default function AiLabel() {
  return <p className="text-xs opacity-60">AIが生成した文章です</p>;
}
