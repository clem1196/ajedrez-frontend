// utils/boardBackground.ts
export function createBoardBackground(light: string, dark: string) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 8 8"
     shape-rendering="crispEdges">

<defs>
  <rect id="l" width="1" height="1" fill="${light}" />
  <rect id="d" width="1" height="1" fill="${dark}" />
</defs>

<g>
${Array.from({ length: 8 }, (_, y) =>
  Array.from({ length: 8 }, (_, x) => {
    const color = (x + y) % 2 === 0 ? "l" : "d";
    return `<use href="#${color}" x="${x}" y="${y}" />`;
  }).join("")
).join("")}
</g>

</svg>`;

  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}