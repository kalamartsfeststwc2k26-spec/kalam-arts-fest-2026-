/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: {
      clay:{900:'#2A1208',800:'#54240C',700:'#843C0C',500:'#B4540C'},
      glaze:{500:'#E49C0C',300:'#F3C25B'}, pink:{500:'#FC246C',600:'#E0145F',700:'#D3125A'},
      sky:{500:'#24B4FC',700:'#0A6FA8'}, lime:{500:'#B4FC24',700:'#4E7A00'},
      violet:{500:'#9C24FC',600:'#7A1FD6'}, tangerine:{500:'#FC9C3C'},
      paper:'#FBF8F6',ink:'#2B1409',muted:'#6B5446',line:'#EBDFD7',kiln:'#2A1208',
      'on-kiln':{DEFAULT:'#F6EBE3',muted:'#C9B3A5'},silver:'#C9C2BD',
      navy:'var(--color-navy)','navy-deep':'var(--color-navy-deep)',burgundy:'var(--color-burgundy)',
      'burgundy-dark':'var(--color-burgundy-dark)',gold:'var(--color-gold)',emerald:'var(--color-emerald)',
      indigo:'var(--color-indigo)',page:'var(--color-page)'
    },
    fontFamily:{display:['Poppins','Baloo Chettan 2','system-ui','sans-serif'],text:['Inter','Noto Sans Malayalam','system-ui','sans-serif'],sans:['Inter','Noto Sans Malayalam','system-ui','sans-serif']},
    boxShadow:{soft:'var(--shadow-soft)',raised:'var(--shadow-raised)',panel:'0 8px 24px rgba(84,36,12,.06)',sticker:'4px 4px 0 #2A1208'},
    borderRadius:{card:'18px',panel:'22px',tile:'16px'},
    transitionDuration:{fast:'140ms',standard:'220ms'}
  }}, plugins:[]
};
