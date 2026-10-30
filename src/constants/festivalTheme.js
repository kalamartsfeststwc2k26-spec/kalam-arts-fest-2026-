export const TEAM_COLOURS = {
  KALIDOS: { fill:'#FC246C', tint:'#FFE3EE', ink:'#D3125A' },
  KALORA: { fill:'#24B4FC', tint:'#DDF3FF', ink:'#0A6FA8' },
  KOSMORA: { fill:'#B4FC24', tint:'#EEFFC4', ink:'#4E7A00' },
};
export const teamColour = name => TEAM_COLOURS[String(name || '').toUpperCase()] || { fill:'#E49C0C', tint:'#F8EDD6', ink:'#843C0C' };
export const CATEGORY_STYLES = {
  'On-stage': { tile:'bg-pink-600 text-white', chip:'bg-[#FFE3EE] text-[#A5104A]', border:'border-l-pink-600', ml:'സ്റ്റേജ് ഇനങ്ങൾ' },
  'Non-stage': { tile:'bg-sky-500 text-ink', chip:'bg-[#DDF3FF] text-[#075E8F]', border:'border-l-sky-500', ml:'സ്റ്റേജിതര ഇനങ്ങൾ' },
  'General': { tile:'bg-lime-500 text-ink', chip:'bg-[#EEFFC4] text-[#3F6600]', border:'border-l-lime-500', ml:'ജനറൽ' },
  'ATTC': { tile:'bg-violet-600 text-white', chip:'bg-[#F0E0FF] text-[#6112AE]', border:'border-l-violet-600', ml:'ATTC' },
};
export const categoryStyle = value => CATEGORY_STYLES[value] || {tile:'bg-clay-700 text-white',chip:'bg-paper text-clay-800',border:'border-l-clay-700',ml:''};
