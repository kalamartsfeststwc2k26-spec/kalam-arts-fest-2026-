const layers = [
  {fill:'#9C24FC',d:'M0 70 C140 30 260 110 420 78 C580 46 700 8 860 40 C1020 72 1140 118 1290 80 C1370 60 1410 44 1440 52 V160 H0 Z'},
  {fill:'#B4FC24',d:'M0 92 C160 56 300 128 470 100 C640 72 760 36 930 66 C1090 94 1200 134 1340 104 C1390 94 1420 84 1440 80 V160 H0 Z'},
  {fill:'#24B4FC',d:'M0 112 C180 82 320 146 500 122 C680 98 800 70 980 96 C1140 118 1250 148 1440 112 V160 H0 Z'},
  {fill:'#FC246C',d:'M0 132 C200 108 340 160 540 140 C740 120 860 100 1040 122 C1200 140 1320 156 1440 132 V160 H0 Z'},
  {fill:'#2A1208',d:'M0 150 C240 132 400 170 620 156 C840 142 980 128 1180 144 C1300 154 1380 162 1440 152 V170 H0 Z'},
];
export default function PaintPour() {
  return <svg aria-hidden="true" focusable="false" className="block h-[clamp(70px,11vw,150px)] w-full bg-paper" viewBox="0 0 1440 160" preserveAspectRatio="none">{layers.map((layer,i)=><path key={i} className="paint-layer" d={layer.d} fill={layer.fill} stroke="#2A1208" strokeWidth="3" vectorEffect="non-scaling-stroke"/>)}</svg>;
}
