import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  X, Plus, Paperclip, Send, Trash2, Menu, Edit2,
  CheckCheck, Check, Play, Pause, MapPin, FolderOpen,
  MessageSquare, ArrowDown, FileText, ChevronDown, File, Image,
  Sun, Moon, Maximize2, Minimize2
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ProjectsPanel from './ProjectsPanel';

// ── Static maps ────────────────────────────────────────────────────────────────

const REGION_CODE_MAP = {
  "yaoundé": "02",
  "yaounde": "02",
  "douala": "05",
  "bamenda": "07",
  "bafoussam": "08",
  "garoua": "06",
  "maroua": "04",
  "ngaoundéré": "01",
  "ngaoundere": "01",
  "buea": "10",
  "limbe": "10"
};

const REGION_NAME_MAP = {
  "01": "Adamaoua",
  "02": "Centre",
  "03": "East",
  "04": "Far North",
  "05": "Littoral",
  "06": "North",
  "07": "North West",
  "08": "West",
  "09": "South",
  "10": "South West"
};

const SUBTYPES = {
  'Residential': ['Single-family house', 'Multi-unit/apartment building'],
  'Agricultural': ['Plantation/crop farming', 'Livestock/ranching', 'Agroforestry'],
  'Enterprise / Commercial': ['Retail', 'Warehouse/logistics', 'Office', 'Light industrial', 'Heavy industrial'],
  'Educational': ['Nursery', 'Primary', 'Secondary', 'University/higher ed'],
  'Institutional / Public': ['Health facility (clinic/hospital)', 'Religious building', 'Government/administrative'],
  'Recreational': ['Sports facility', 'Park/green space', 'Event venue']
};

const SIZE_RANGES = {
  'Single-family house': '800–1,500 m²',
  'Multi-unit/apartment building': '1,500–5,000 m²',
  'Plantation/crop farming': '5,000–50,000 m²',
  'Livestock/ranching': '10,000–100,000 m²',
  'Agroforestry': '5,000–30,000 m²',
  'Retail': '500–3,000 m²',
  'Warehouse/logistics': '2,000–20,000 m²',
  'Office': '500–5,000 m²',
  'Light industrial': '3,000–15,000 m²',
  'Heavy industrial': '10,000–50,000 m²',
  'Nursery': '500–2,000 m²',
  'Primary': '2,000–5,000 m²',
  'Secondary': '5,000–15,000 m²',
  'University/higher ed': '20,000–200,000 m²',
  'Health facility (clinic/hospital)': '1,000–10,000 m²',
  'Religious building': '500–5,000 m²',
  'Government/administrative': '1,000–10,000 m²',
  'Sports facility': '5,000–50,000 m²',
  'Park/green space': '2,000–20,000 m²',
  'Event venue': '2,000–10,000 m²'
};

const MOCK_PLOTS_FALLBACK = [
  {
    _id: 'p1',
    landCode: '10005-02-05909-44256',
    location: 'Yaoundé-Centre',
    area: 1200,
    landType: '10005',
    status: 'cleared'
  },
  {
    _id: 'p2',
    landCode: '00050-02-00000-11234',
    location: 'Yaoundé-Mfoundi',
    area: 950,
    landType: '00050',
    status: 'cleared'
  },
  {
    _id: 'p3',
    landCode: '10005-05-01234-88762',
    location: 'Douala-Littoral',
    area: 1450,
    landType: '10005',
    status: 'cleared'
  },
  {
    _id: 'p4',
    landCode: '00050-05-00000-99887',
    location: 'Douala-Akwa',
    area: 2500,
    landType: '00050',
    status: 'cleared'
  }
];

const INITIAL_PROJECTS = [
  { id: 'proj-1', name: 'Residential Search', emoji: '🏠' },
  { id: 'proj-2', name: 'Commercial Expansion', emoji: '🏢' },
];

// ── Matching logic ─────────────────────────────────────────────────────────────

function matchPlots(state, dbPlots, relax = false) {
  let targetRegionCode = "";
  for (const [k, v] of Object.entries(REGION_NAME_MAP)) {
    if (v.toLowerCase() === (state.region || "").toLowerCase()) {
      targetRegionCode = k;
      break;
    }
  }
  if (!targetRegionCode) {
    const s = (state.region || "").toLowerCase();
    targetRegionCode = REGION_CODE_MAP[s] || "";
  }

  let targetSize = 1200;
  const sizeNumMatch = (state.size || "").replace(/[\s,]/g, '').match(/(\d+)/);
  if (sizeNumMatch) {
    targetSize = parseInt(sizeNumMatch[0], 10);
  }

  const plotsToUse = dbPlots.length > 0 ? dbPlots : MOCK_PLOTS_FALLBACK;

  const matches = plotsToUse.filter(plot => {
    if (plot.status !== 'cleared') return false;

    const segments = (plot.landCode || "").split("-");
    const plotRegionCode = segments[1];
    if (targetRegionCode && plotRegionCode !== targetRegionCode) {
      if (!relax) return false;
    }

    if (state.landPref === 'Public' && plot.landType !== '00050') return false;
    if (state.landPref === 'Private' && plot.landType !== '10005') return false;

    const sizeBandPercent = relax ? 0.6 : 0.3;
    const plotArea = plot.area || 1000;
    const minSize = targetSize * (1 - sizeBandPercent);
    const maxSize = targetSize * (1 + sizeBandPercent);
    if (plotArea < minSize || plotArea > maxSize) {
      return false;
    }

    return true;
  });

  const ranked = matches.map(plot => {
    const segments = (plot.landCode || "").split("-");
    const plotRegionCode = segments[1];
    const plotRegionName = REGION_NAME_MAP[plotRegionCode] || state.region || 'Cameroon';
    const plotArea = plot.area || 1000;
    const sizeRatio = Math.min(plotArea, targetSize) / Math.max(plotArea, targetSize);
    const matchScore = Math.round(sizeRatio * 100);

    return {
      id: plot._id || plot.id,
      landCode: plot.landCode,
      region: plotRegionName,
      size: `${plotArea.toLocaleString()} m²`,
      ownership: plot.landType === '00050' ? 'Public' : 'Private',
      zoning: `${state.category || 'General'} Zoning`,
      matchReason: `Plot area (${plotArea}m²) is a ${matchScore}% match for your desired ${targetSize}m²; located in ${plotRegionName} (${plot.location || 'Registry Location'}); registered as ${plot.landType === '00050' ? 'state-owned public' : 'privately-owned'} land.`,
      matchScore: matchScore
    };
  });

  ranked.sort((a, b) => b.matchScore - a.matchScore);
  return ranked.slice(0, 3);
}

// ── Bot reply logic ────────────────────────────────────────────────────────────

function parseCategory(input) {
  const s = input.toLowerCase();
  if (/resid|house|home|apart/.test(s)) return 'Residential';
  if (/agri|farm|crop|plant|livestock|ranch|forest/.test(s)) return 'Agricultural';
  if (/commerc|office|retail|warehou|industr|enterpr/.test(s)) return 'Enterprise / Commercial';
  if (/educ|school|univ/.test(s)) return 'Educational';
  if (/instit|health|hosp|clinic|govern|religio|public/.test(s)) return 'Institutional / Public';
  if (/recre|sport|park|event/.test(s)) return 'Recreational';
  if (/mixed/.test(s)) return 'Mixed-use';
  if (/other|unspec/.test(s)) return 'Other / Unspecified';
  return null;
}

function getBotReply(input, state, dbPlots) {
  const s = input.toLowerCase();

  const isOutScope = /legal|zoning-compliance|authenticity|verify|ownership|negotiat|price|buy|discount|advise/i.test(s) && 
                      !(/public|private|budget|skip/i.test(s));
  if (isOutScope && state.stage !== 'land-pref' && state.stage !== 'budget') {
    return {
      content: "⚠️ **Official Disclaimer**\n\nI cannot confirm ownership authenticity, verify legal status, or negotiate pricing for any plot. These processes are strictly handled by TerraTrace's core registry systems and authorized Officers.\n\nMy role is to match and shortlist plots based on your requirements. Let's return to your search: what category best describes your project?",
      newState: state,
      quickReplies: ['Residential', 'Agricultural', 'Enterprise / Commercial', 'Educational', 'Institutional / Public', 'Recreational']
    };
  }

  // 1. Transfer query with interactive follow-up question
  const isTransferQuery = /how\s+is\s+(the\s+)?transfer\s+done|transfer\s+process|documents?\s+required|how\s+to\s+transfer|requirements?\s+for\s+transfer|transfer\s+steps/i.test(s);
  if (isTransferQuery && !/purchase|inheritance|succession/i.test(s)) {
    return {
      content: `To provide the exact document checklist and procedure, please let me know:\n\n**Are you doing a transfer by purchase or a transfer by inheritance?**`,
      newState: state,
      quickReplies: ['Transfer by Purchase', 'Transfer by Inheritance']
    };
  }

  // 2. Transfer by Purchase documents
  if (/purchase|acte\s+de\s+vente|deed\s+of\s+sale/i.test(s) && /document|requirement|transfer|need/i.test(s)) {
    return {
      content: `For a **Transfer by Purchase** on TerraTrace, the following required documents must be uploaded during application initiation:\n\n1. **Deed of Sale** (*Acte de Vente*) — signed and certified by an accredited Notary Officer.\n2. **National Identity Card (CNI)** — valid copy of the buyer.\n3. **Official Land Title** (*Titre Foncier*) — scanned copy of the original title deed.\n\n*(If acquiring a sub-portion/morcellement, you will also specify your target surface area in m²)*.\n\nWould you like to initiate a transfer now on one of our available land plots?`,
      newState: state,
      quickReplies: ['Land Plots Directory', 'Initiate Transfer', 'Ask About Roles']
    };
  }

  // 3. Transfer by Inheritance documents
  if (/inheritance|succession|jugement\s+d'h[eé]r[eé]dit[eé]/i.test(s) && /document|requirement|transfer|need/i.test(s)) {
    return {
      content: `For a **Transfer by Inheritance** on TerraTrace, the following required documents must be uploaded during application initiation:\n\n1. **Inheritance Certificate** (*Jugement d'Hérédité*) — officially notified/certified by the Notary.\n2. **National Identity Card (CNI)** — valid copy of the legal heir/beneficiary.\n3. **Official Land Title** (*Titre Foncier*) — scanned copy of the original land title.\n\nWould you like to explore our land plots or ask about platform security?`,
      newState: state,
      quickReplies: ['Land Plots Directory', 'Escrow Security', 'Public Notice Info']
    };
  }

  // 4. Role definitions in TerraTrace
  const isRoleQuery = /what\s+is\s+a\s+(client|landowner|notary|land\s+registry\s+officer|lro|admin)|roles?\s+in\s+terratrace|who\s+is\s+the\s+(admin|lro|notary)/i.test(s);
  if (isRoleQuery) {
    return {
      content: `Here is a breakdown of user roles and responsibilities on TerraTrace:\n\n• **Client**: A registered user on our platform who holds an account but does not yet own any piece of land.\n• **Landowner**: The registered owner of a land plot. A landowner profile is created/linked whenever an LRO or Admin registers a plot on the platform.\n• **Notary Officer**: The legal notary in charge of certifying and evaluating transfer applications, verifying legal deeds, and transmitting certified dossiers to the Land Registry.\n• **Land Registry Officer (LRO)**: The government official who reviews notarized dossiers, publishes public notices, handles objections, authorizes title transfers, and generates new Land Codes.\n• **Admin (MINCAF)**: The Ministry of Mindcaf administrator managing the entire platform, officer accounts, public notice boards, and system parameters.`,
      newState: state,
      quickReplies: ['Escrow Security', 'Public Notice Info', 'Land Code Breakdown']
    };
  }

  // 5. Public Notice explanation
  const isPublicNoticeQuery = /public\s+notice|objection|opposition|30\s+days|disputed\s+status/i.test(s);
  if (isPublicNoticeQuery) {
    return {
      content: `**What is a Public Notice on TerraTrace?**\n\nA **Public Notice** is an official public statement published on the portal for a mandatory period of **30 days**.\n\n• **Purpose**: It allows any member of the public or interested third party to review proposed land transfers and file a formal objection if they hold a conflicting claim.\n• **Effect of Objection**: If a valid objection is filed during the 30-day window, the Land Registry Officer marks the land status as **Disputed**, halting the transfer until legal resolution.`,
      newState: state,
      quickReplies: ['Escrow Security', 'Land Transfer Process', 'User Roles']
    };
  }

  // 6. Escrow Payment & Security
  const isSecurityQuery = /escrow|security|recaptcha|2fa|payment\s+security|how\s+escrow\s+works/i.test(s);
  if (isSecurityQuery) {
    return {
      content: `**TerraTrace Security & Escrow Payment System:**\n\n1. **Escrow Payment**: When a client pays a fee notice issued by a Notary, funds are locked safely inside the **TerraTrace Escrow Account** (platform fees deducted). Funds remain protected until the LRO completes verification, publishes the public notice, and authorizes final title transfer.\n2. **2FA & reCAPTCHA**: Multi-factor authentication (2FA) and Google reCAPTCHA protect logins, password resets, and critical administrative transactions from unauthorized access and automated bot attacks.`,
      newState: state,
      quickReplies: ['Land Code Breakdown', 'Public Notice Info', 'Land Transfer Steps']
    };
  }

  // 7. Land Code Generation Structure
  const isLandCodeQuery = /land\s+code|code\s+generation|how\s+land\s+code\s+works|segment|10005|00050/i.test(s);
  if (isLandCodeQuery) {
    return {
      content: `**TerraTrace Land Code Generation Structure:**\n\nFormat: **[LandType]-[RegionCode]-[OwnerCNI]-[PlotNumber]**\n\n1. **1st Segment — Land Type**: \`00050\` = Public / State Land; \`10005\` = Private Individual Land.\n2. **2nd Segment — Region Code**: 2-digit Cameroon administrative code (01 Adamaoua, 02 Centre, 03 East, 04 Far North, 05 Littoral, 06 North, 07 North West, 08 West, 09 South, 10 South West).\n3. **3rd Segment — Owner CNI / Identifier**: 5-digit CNI number of the landowner (\`00000\` for state land).\n4. **4th Segment — Plot Number & Sub-portion**: Unique plot number from the Titre Foncier (with optional sub-portion extension like \`-P7545\` for morcellement).`,
      newState: state,
      quickReplies: ['Explore Plots', 'Transfer Documents', 'User Roles']
    };
  }

  const isGreeting = /^(hello|hi|hey|yo|bonjour|salut|good\s+morning|good\s+afternoon|good\s+evening)/i.test(s);
  if (isGreeting && state.stage === 'category') {
    return {
      content: "Hello! Welcome to **TerraTrace Land Advisor**. I'm here to help you match and shortlist suitable land plots from our verified registry based on your project goals.\n\nTo get started, what category best describes your project?",
      newState: state,
      quickReplies: ['Residential', 'Agricultural', 'Enterprise / Commercial', 'Educational', 'Institutional / Public', 'Recreational']
    };
  }

  const isCorrection = /actually|change|update|instead|modify|correct/i.test(s);
  if (isCorrection) {
    const knownRegion = Object.keys(REGION_CODE_MAP).find(k => s.includes(k));
    if (knownRegion) {
      const regionCode = REGION_CODE_MAP[knownRegion];
      const regionName = REGION_NAME_MAP[regionCode];
      state.region = regionName;
      return {
        content: `Understood, region updated to **${regionName}**.\n\nLet's continue. Do you have a specific size in mind, or shall I search using the typical range for **${state.subtype || 'your project'}**?`,
        newState: { ...state, stage: 'size' }
      };
    }
    const sizeMatch = s.match(/\d+[\s,]*\d*\s*(m²|sqm|square\s*meters|hectares|ha)/i) || s.match(/size\s+(?:to\s+)?(\d+)/i);
    if (sizeMatch) {
      const sizeVal = sizeMatch[0];
      state.size = sizeVal;
      return {
        content: `Understood, target size updated to **${sizeVal}**.\n\nLet's continue. Do you have a preference for public or private land ownership?`,
        newState: { ...state, stage: 'land-pref' },
        quickReplies: ['Public land', 'Private land', 'No preference']
      };
    }
    if (/public/i.test(s)) {
      state.landPref = 'Public';
      return {
        content: `Understood, land preference updated to **Public**.\n\nLet's continue. Do you have an optional budget range?`,
        newState: { ...state, stage: 'budget' },
        quickReplies: ['Skip', 'Under 10M FCFA', '10–30M FCFA', '30–60M FCFA', 'Above 60M FCFA']
      };
    }
    if (/private/i.test(s)) {
      state.landPref = 'Private';
      return {
        content: `Understood, land preference updated to **Private**.\n\nLet's continue. Do you have an optional budget range?`,
        newState: { ...state, stage: 'budget' },
        quickReplies: ['Skip', 'Under 10M FCFA', '10–30M FCFA', '30–60M FCFA', 'Above 60M FCFA']
      };
    }
  }

  if (state.stage === 'category') {
    const cat = parseCategory(input);
    if (!cat) return {
      content: "I didn't quite catch that. What category of project are you planning?",
      newState: state,
      quickReplies: ['Residential', 'Agricultural', 'Enterprise / Commercial', 'Educational', 'Institutional / Public', 'Recreational'],
    };
    if (cat === 'Mixed-use') return {
      content: "⚠️ **Mixed-use** projects involve multiple zoning types and require manual review by our land officers.\n\nDescribe the combination you have in mind — e.g., residential + commercial — and I will route it to an LRO for review.",
      newState: { stage: 'category' },
    };
    if (cat === 'Other / Unspecified') return {
      content: "Understood. Since your project type is unique, I have routed your query directly to our support desk. A human officer will get back to you shortly.",
      newState: { stage: 'category' },
    };
    return {
      content: `**${cat}** project noted. Which sub-type best describes your plans?`,
      newState: { ...state, stage: 'subtype', category: cat },
      quickReplies: SUBTYPES[cat] || [],
    };
  }

  if (state.stage === 'subtype') {
    const subs = SUBTYPES[state.category || ''] || [];
    const matched = subs.find(x => s.includes(x.toLowerCase())) || input;
    const range = SIZE_RANGES[matched] || '1,000–5,000 m²';
    return {
      content: `**${matched}** — typical plot size for this sub-type is **${range}**.\n\nWhich region in Cameroon are you targeting?`,
      newState: { ...state, stage: 'region', subtype: matched },
      quickReplies: ['Yaoundé', 'Douala', 'Bamenda', 'Bafoussam', 'Garoua', 'Maroua', 'Ngaoundéré', 'Buea', 'Limbe'],
    };
  }

  if (state.stage === 'region') {
    const knownRegion = Object.keys(REGION_CODE_MAP).find(k => s.includes(k)) || s;
    const regionCode = REGION_CODE_MAP[knownRegion];
    const regionName = REGION_NAME_MAP[regionCode] || (knownRegion.charAt(0).toUpperCase() + knownRegion.slice(1));
    const range = SIZE_RANGES[state.subtype || ''] || '1,000–5,000 m²';
    return {
      content: `**${regionName}** region noted. Based on the **${state.subtype}** reference, typical size is **${range}**.\n\nDo you have a specific size in mind, or shall I use this range?`,
      newState: { ...state, stage: 'size', region: regionName },
    };
  }

  if (state.stage === 'size') {
    return {
      content: `Approximately **${input}** — noted.\n\nDo you have a preference for public or private land ownership?`,
      newState: { ...state, stage: 'land-pref', size: input },
      quickReplies: ['Public land', 'Private land', 'No preference'],
    };
  }

  if (state.stage === 'land-pref') {
    const pref = s.includes('public') ? 'Public' : s.includes('private') ? 'Private' : 'No preference';
    return {
      content: `**${pref}** preference noted.\n\nOptional: do you have a budget range? This filters results but won't affect ranking order. You can skip this step.`,
      newState: { ...state, stage: 'budget', landPref: pref },
      quickReplies: ['Skip', 'Under 10M FCFA', '10–30M FCFA', '30–60M FCFA', 'Above 60M FCFA'],
    };
  }

  if (state.stage === 'budget') {
    const budget = s.includes('skip') ? 'Not specified' : input;
    return {
      content: `Here is a summary of your search criteria:\n\n• **Category:** ${state.category} — ${state.subtype}\n• **Region:** ${state.region}\n• **Size:** ~${state.size}\n• **Land preference:** ${state.landPref}\n• **Budget:** ${budget}\n\nShall I run the search now?`,
      newState: { ...state, stage: 'results' },
      quickReplies: ['Yes, search now', 'Modify constraints'],
    };
  }

  if (state.stage === 'results') {
    if (/(yes|search|run|proceed|query)/.test(s)) {
      const results = matchPlots(state, dbPlots);
      if (results.length > 0) {
        return {
          content: `Here are **${results.length} matching plots** based on your criteria. Matches are at region level — not exact GPS location.\n\n⚠️ Recommendations ≠ verified ownership. Always verify authenticity via TerraTrace's core system before proceeding.`,
          plots: results,
          kind: 'plots',
          newState: { stage: 'category' },
        };
      } else {
        const relaxed = matchPlots(state, dbPlots, true);
        if (relaxed.length > 0) {
          return {
            content: `No exact matches found. However, I found **${relaxed.length} relaxed alternative plots** (wider size margins or nearby region plots) for your consideration:`,
            plots: relaxed,
            kind: 'plots',
            newState: { stage: 'category' }
          };
        } else {
          return {
            content: "No matching plots found in our registry even after expanding the size limits. Would you like to start a new search?",
            quickReplies: ['Start New Search'],
            newState: { stage: 'category' }
          };
        }
      }
    }
    return {
      content: "Of course — which constraint would you like to update?",
      newState: { stage: 'region' },
      quickReplies: ['Change region', 'Change size', 'Change land preference'],
    };
  }

  return {
    content: "I'm here to help you find suitable land plots from our verified inventory. What type of project are you planning?",
    newState: { stage: 'category' },
    quickReplies: ['Residential', 'Agricultural', 'Enterprise / Commercial', 'Educational', 'Institutional / Public', 'Recreational'],
  };
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtTime(d) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtRelative(d) {
  const h = (Date.now() - d.getTime()) / 3600000;
  if (h < 1) return 'Just now';
  if (h < 24) return `${Math.round(h)}h ago`;
  if (h < 48) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function renderMd(text, navigate, setIsOpen) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={li}>
        {parts.map((p, pi) => {
          if (p.startsWith('**') && p.endsWith('**')) {
            return <strong key={pi} className="font-semibold">{p.slice(2, -2)}</strong>;
          }
          
          // Regex to match [text](url)
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          const linkParts = [];
          let lastIndex = 0;
          let match;
          
          while ((match = linkRegex.exec(p)) !== null) {
            const [fullMatch, linkText, url] = match;
            const startIndex = match.index;
            
            if (startIndex > lastIndex) {
              linkParts.push(p.slice(lastIndex, startIndex));
            }
            
            linkParts.push(
              <a
                key={startIndex}
                href={url}
                onClick={(e) => {
                  e.preventDefault();
                  if (url.startsWith('/dashboard/land-plots') || url.includes('/land-plots')) {
                    // Extract search query
                    let searchParam = '';
                    try {
                      const qIndex = url.indexOf('?search=');
                      if (qIndex !== -1) {
                        searchParam = decodeURIComponent(url.substring(qIndex + 8));
                      } else {
                        const plotIndex = url.indexOf('plot:');
                        if (plotIndex !== -1) {
                          searchParam = url.substring(plotIndex + 5);
                        }
                      }
                    } catch (err) {
                      console.error(err);
                    }
                    
                    navigate(`/dashboard/land-plots?search=${encodeURIComponent(searchParam)}`, { 
                      state: { searchPlot: searchParam } 
                    });
                    setIsOpen(false);
                  } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="underline font-medium hover:text-[#D4AF37] transition-all cursor-pointer"
                style={{ color: '#D4AF37', textDecoration: 'underline' }}
              >
                {linkText}
              </a>
            );
            
            lastIndex = linkRegex.lastIndex;
          }
          
          if (lastIndex < p.length) {
            linkParts.push(p.slice(lastIndex));
          }
          
          return <span key={pi}>{linkParts.length > 0 ? linkParts : p}</span>;
        })}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

function makeWelcomeMsg() {
  const greetings = [
    "Hey! 👋 I'm the TerraTrace AI. I can help you find land plots, understand zoning rules, and plan projects across all 10 regions of Cameroon.\n\nWhat are you looking for today?",
    "Welcome! I'm TerraTrace AI — your land advisory assistant for Cameroon. 🌍\n\nTell me what kind of project you have in mind and I'll help you find the right plots.",
    "Hello there! 👋 Ready to help you find the perfect land in Cameroon.\n\nAre you looking for residential, agricultural, commercial, or another type of land?",
  ];
  return {
    id: uid(),
    role: 'bot',
    kind: 'text',
    content: greetings[Math.floor(Math.random() * greetings.length)],
    timestamp: new Date(),
    quickReplies: ['Residential plot', 'Agricultural land', 'Commercial space', 'What plots are available?', 'Explain land codes'],
  };
}

function makeInitialChats() {
  return [
    {
      id: 'chat-1', title: 'New Conversation',
      preview: 'Ask me anything about land in Cameroon...',
      timestamp: new Date(), messages: [makeWelcomeMsg()],
    },
  ];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const LogoMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="6 4 36 44" fill="none">
    <path d="M24 6L40 14V38L24 46L8 38V14L24 6Z" fill="url(#lmg)" />
    <path d="M24 14V38M16 20H32M18 32L24 38L30 32" stroke="#002147" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    <circle cx="24" cy="38" r="3.5" fill="#002147" />
    <defs>
      <linearGradient id="lmg" x1="8" y1="6" x2="40" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F4C430" /><stop offset="0.5" stopColor="#D4AF37" /><stop offset="1" stopColor="#B8860B" />
      </linearGradient>
    </defs>
  </svg>
);

function Waveform({ playing }) {
  const bars = [3, 6, 10, 14, 9, 13, 11, 7, 12, 8, 5, 10, 14, 7, 4, 9, 12, 6, 3];
  return (
    <div className="flex items-center gap-[2px] h-5">
      {bars.map((h, i) => (
        <motion.div key={i} className="w-[2px] rounded-full bg-current"
          style={{ height: `${h}px`, opacity: 0.75 }}
          animate={playing ? { scaleY: [1, 1.8, 1] } : { scaleY: 1 }}
          transition={playing ? { duration: 0.7, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' } : {}}
        />
      ))}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'sending') return <div className="w-3 h-3 rounded-full border border-current opacity-40 animate-spin" />;
  if (status === 'sent') return <Check size={11} className="opacity-40" />;
  if (status === 'delivered') return <CheckCheck size={11} className="opacity-40" />;
  return <CheckCheck size={11} style={{ color: '#D4AF37' }} />;
}

function TypingDots() {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}>
        <LogoMark size={18} />
      </div>
      <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5" style={{ background: '#0c3560', borderBottomLeftRadius: 4 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}

function FileKindIcon({ kind }) {
  if (kind === 'image') return <Image size={13} />;
  if (kind === 'pdf') return <FileText size={13} />;
  return <File size={13} />;
}

function PlotCard({ plot }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(0,21,51,0.8)', border: '1px solid rgba(212,175,55,0.22)' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold tracking-wider" style={{ color: '#D4AF37', fontFamily: 'monospace' }}>{plot.landCode}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="opacity-50" style={{ color: '#fff' }} />
              <span className="text-[11px] text-white/55">{plot.region}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-white">{plot.size}</div>
            <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{
                background: plot.ownership === 'Public' ? 'rgba(52,211,153,0.13)' : 'rgba(96,165,250,0.13)',
                color: plot.ownership === 'Public' ? '#6ee7b7' : '#93c5fd',
              }}>
              {plot.ownership}
            </span>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/35 uppercase tracking-wider">Zoning</span>
          <span className="text-[11px] text-white/65 font-medium">{plot.zoning}</span>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/35 uppercase tracking-wider">Match score</span>
            <span className="text-xs font-bold" style={{ color: '#D4AF37' }}>{plot.matchScore}%</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${plot.matchScore}%`, background: 'linear-gradient(90deg, #B8860B, #F4C430)' }} />
          </div>
        </div>
        <p className="text-[11px] text-white/45 leading-relaxed">{plot.matchReason}</p>
      </div>
    </div>
  );
}

function MessageBubble({ msg, playingId, onPlayVoice, onQuickReply, userInitials, navigate, setIsOpen, isLightMode }) {
  const isUser = msg.role === 'user';
  const isPlaying = playingId === msg.id;

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1 w-full`}>
      {!isUser && (
        <div className="flex items-center gap-2 mb-0.5 ml-9">
          <span className="text-[11px]" style={{ color: 'rgba(212,175,55,0.65)' }}>TerraTrace Advisor</span>
        </div>
      )}
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 w-full`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-5"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}>
            <LogoMark size={18} />
          </div>
        )}
        {isUser && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-5"
            style={{ background: 'linear-gradient(135deg, #001f4a, #003580)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
            {userInitials || "JM"}
          </div>
        )}

        <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} ${msg.kind === 'plots' ? 'w-full' : 'max-w-[85%] w-fit'}`}>
          <div className="px-4 py-3 text-sm leading-relaxed" style={{
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser 
              ? (isLightMode ? '#EAE5DB' : '#D4AF37') 
              : (isLightMode ? '#FFFFFF' : '#0c3560'),
            color: isUser 
              ? (isLightMode ? '#2D2B2A' : '#002147') 
              : (isLightMode ? '#2D2B2A' : '#dde8f5'),
            border: isLightMode && !isUser ? '1px solid #E5E2D9' : 'none',
            boxShadow: isLightMode ? '0 1px 4px rgba(0,0,0,0.03)' : 'none',
            width: msg.kind === 'plots' ? '100%' : 'fit-content'
          }}>
            {msg.kind === 'voice' && (
              <div className="flex items-center gap-3">
                <button onClick={() => onPlayVoice(msg.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                  style={{ background: isUser ? 'rgba(0,33,71,0.18)' : 'rgba(212,175,55,0.18)' }}>
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <div style={{ color: isUser ? '#002147' : '#D4AF37' }}>
                  <Waveform playing={isPlaying} />
                </div>
                <span className="text-xs opacity-60 flex-shrink-0">{msg.voiceDuration}s</span>
              </div>
            )}
            {msg.kind === 'file' && (
              <div className="space-y-1.5">
                {msg.content && <p className="whitespace-pre-wrap mb-2">{renderMd(msg.content, navigate, setIsOpen)}</p>}
                {msg.files?.map(f => (
                  <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: isUser ? 'rgba(0,33,71,0.12)' : 'rgba(212,175,55,0.08)' }}>
                    <span style={{ color: isUser ? '#002147' : '#D4AF37', opacity: 0.8 }}><FileKindIcon kind={f.kind} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{f.name}</div>
                      <div className="text-[10px] opacity-50 mt-0.5">{f.size}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {msg.kind === 'plots' && (
              <div className="space-y-3 w-full">
                <p className="whitespace-pre-wrap">{renderMd(msg.content, navigate, setIsOpen)}</p>
                <div className="space-y-3 w-full">
                  {msg.plots?.map(p => <PlotCard key={p.id} plot={p} />)}
                </div>
              </div>
            )}
            {msg.kind === 'text' && (
              <p className="whitespace-pre-wrap">{renderMd(msg.content, navigate, setIsOpen)}</p>
            )}
          </div>

          {msg.quickReplies && msg.quickReplies.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {msg.quickReplies.map(qr => (
                <button key={qr} onClick={() => onQuickReply(qr)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95"
                  style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', background: 'rgba(212,175,55,0.06)' }}>
                  {qr}
                </button>
              ))}
            </div>
          )}

          <div className={`flex items-center gap-1 ${isUser ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>{fmtTime(msg.timestamp)}</span>
            {isUser && msg.status && (
              <span style={{ color: msg.status === 'read' ? '#D4AF37' : 'rgba(255,255,255,0.3)' }}>
                <StatusIcon status={msg.status} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, count, expanded, onToggle, isLightMode }) {
  return (
    <button onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-2 transition-colors"
      style={{ color: isLightMode ? '#B8860B' : 'rgba(212,175,55,0.5)' }}>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {count !== undefined && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>{count}</span>
        )}
      </div>
      <ChevronDown size={11} className={`transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
    </button>
  );
}

function ChatListItem({ chat, active, onSelect, onDelete, onRename, isLightMode }) {
  const [hov, setHov] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);

  const handleSave = (e) => {
    e.stopPropagation();
    if (title.trim() && title.trim() !== chat.title) {
      onRename(chat.id, title.trim());
    }
    setEditing(false);
  };

  return (
    <div className="group relative mx-2 rounded-xl cursor-pointer transition-all duration-150"
      style={{
        background: active
          ? (isLightMode ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.09)')
          : hov
          ? (isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)')
          : 'transparent',
        borderLeft: `2px solid ${active ? '#D4AF37' : 'transparent'}`,
      }}
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <div className="px-3 py-2.5 pr-14">
        <div className="flex items-start justify-between gap-1">
          {editing ? (
            <input
              value={title}
              onClick={e => e.stopPropagation()}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave(e);
                if (e.key === 'Escape') setEditing(false);
              }}
              onBlur={handleSave}
              className={`text-xs font-medium bg-transparent border-b border-[#D4AF37] outline-none w-full ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}
              autoFocus
            />
          ) : (
            <span className="text-xs font-medium truncate flex-1 leading-tight"
              style={{ color: active ? '#D4AF37' : (isLightMode ? '#2D2B2A' : 'rgba(255,255,255,0.82)') }}>
              {chat.title}
            </span>
          )}
          {!editing && (
            <span className="text-[9px] flex-shrink-0 mt-0.5"
              style={{ color: isLightMode ? '#8C877D' : 'rgba(255,255,255,0.28)' }}>
              {fmtRelative(chat.timestamp)}
            </span>
          )}
        </div>
        <p className="text-[11px] truncate mt-0.5"
          style={{ color: isLightMode ? '#666259' : 'rgba(255,255,255,0.36)' }}>
          {chat.preview}
        </p>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
          title="Rename chat">
          <Edit2 size={11} />
        </button>
        <button onClick={(e) => onDelete(chat.id, e)}
          className="p-1 rounded hover:bg-red-500/10 text-red-400/60 hover:text-red-400"
          title="Delete chat">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ChatbotInterface() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const userId = authUser?._id || authUser?.id || 'guest';
  const userName = authUser ? `${authUser.firstName} ${authUser.lastName}` : "Jean-Baptiste Mbeki";
  const userRole = authUser ? authUser.role : "Client";
  const userInitials = authUser 
    ? `${authUser.firstName?.charAt(0) || ''}${authUser.lastName?.charAt(0) || ''}`.toUpperCase() 
    : "JM";

  const [isOpen, setIsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [chats, setChats] = useState(() => {
    try {
      const stored = localStorage.getItem(`terratrace_chatbot_chats_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(c => ({
          ...c,
          timestamp: new Date(c.timestamp),
          messages: c.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
      }
    } catch (e) {
      console.error("Failed to load stored chatbot chats:", e);
    }
    return makeInitialChats();
  });
  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      const stored = localStorage.getItem(`terratrace_chatbot_active_${userId}`);
      if (stored) return stored;
    } catch (e) {}
    return 'chat-1';
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDown, setShowDown] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [sections, setSections] = useState({ chats: true, projects: true, recent: false });
  const [showProjects, setShowProjects] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to load projects in chatbot:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpenProjectSidebar = useCallback(async (proj) => {
    try {
      const res = await api.get(`/projects/${proj._id}`);
      if (res.data.success) {
        setActiveProject(res.data.data);
        setShowProjects(true);
      }
    } catch (err) {
      console.error("Failed to load project details from sidebar:", err);
      setActiveProject(proj);
      setShowProjects(true);
    }
  }, []);
  const [convStates, setConvStates] = useState(() => {
    try {
      const stored = localStorage.getItem(`terratrace_chatbot_states_${userId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { 'chat-1': { stage: 'category' } };
  });
  const [dbPlots, setDbPlots] = useState([]);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(`terratrace_chatbot_chats_${userId}`, JSON.stringify(chats));
    } catch (e) {
      console.error("Failed to save chats to storage:", e);
    }
  }, [chats, userId]);

  useEffect(() => {
    try {
      localStorage.setItem(`terratrace_chatbot_active_${userId}`, activeChatId);
    } catch (e) {}
  }, [activeChatId, userId]);

  useEffect(() => {
    try {
      localStorage.setItem(`terratrace_chatbot_states_${userId}`, JSON.stringify(convStates));
    } catch (e) {}
  }, [convStates, userId]);

  const messagesRef = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages ?? [];
  const convState = convStates[activeChatId] ?? { stage: 'category' };

  const updateConvState = useCallback((id, s) => {
    setConvStates(prev => ({ ...prev, [id]: s }));
  }, []);

  // Fetch real plots from database on mount
  useEffect(() => {
    api.get('/land')
      .then(res => {
        if (res.data.success) {
          setDbPlots(res.data.data);
        }
      })
      .catch(err => console.error("Chatbot failed to fetch real plots:", err));
  }, []);

  const [isEnabledGlobally, setIsEnabledGlobally] = useState(true);

  // Check global config for chatbot enablement
  useEffect(() => {
    api.get('/config')
      .then(res => {
        if (res.data.success) {
          const config = res.data.data;
          if (config.chatbotEnabled !== undefined) {
            setIsEnabledGlobally(config.chatbotEnabled);
          }
        }
      })
      .catch(err => console.error("Failed to load global config:", err));
  }, []);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const handleScroll = () => {
    if (!messagesRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    setShowDown(scrollHeight - scrollTop - clientHeight > 180);
  };

  // New chat
  const newChat = useCallback(() => {
    const id = uid();
    const chat = {
      id, title: 'New Conversation',
      preview: 'What category best describes your project?',
      timestamp: new Date(), messages: [makeWelcomeMsg()],
    };
    setChats(prev => [chat, ...prev]);
    setActiveChatId(id);
    updateConvState(id, { stage: 'category' });
    setInput('');
    setPendingFiles([]);
  }, [updateConvState]);

  // Delete chat
  const deleteChat = useCallback((chatId, e) => {
    e.stopPropagation();
    setChats(prev => {
      const remaining = prev.filter(c => c.id !== chatId);
      if (activeChatId === chatId && remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      }
      return remaining;
    });
  }, [activeChatId]);

  // Send message
  // Send message
  const sendMessage = useCallback((override) => {
    const content = override || input.trim();
    if (!content && pendingFiles.length === 0) return;

    const chatId = activeChatId;
    const msgId = uid();
    const userMsg = {
      id: msgId, role: 'user',
      kind: pendingFiles.length > 0 ? 'file' : 'text',
      content: content || (pendingFiles.length > 0 ? 'Attached files' : ''),
      timestamp: new Date(), status: 'sending',
      files: pendingFiles.length > 0 ? [...pendingFiles] : undefined,
    };

    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      messages: [...c.messages, userMsg],
      preview: (userMsg.content || 'Attached files').slice(0, 60),
      timestamp: new Date(),
      title: c.title === 'New Conversation' && content ? content.slice(0, 42) : c.title,
    } : c));
    setInput('');
    setPendingFiles([]);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }

    setTimeout(() => setChats(prev => prev.map(c => c.id === chatId ? {
      ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, status: 'delivered' } : m),
    } : c)), 400);

    setIsTyping(true);

    // Call backend AI chatbot endpoint — send last 12 messages max for speed + file contents
    const currentChat = chats.find(c => c.id === chatId);
    const chatHistory = [...(currentChat?.messages || []), userMsg];
    const historyToSend = chatHistory.slice(-12).map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      content: m.content || ''
    }));

    const fileContents = pendingFiles
      .filter(f => f.textContent)
      .map(f => ({ name: f.name, content: f.textContent }));

    // Prepare streaming bot message placeholder
    const botMsgId = uid();
    let streamText = '';
    
    const token = localStorage.getItem('terratrace_token');
    
    fetch('http://localhost:5001/api/chatbot/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ messages: historyToSend, fileContents })
    })
    .then(async response => {
      if (!response.ok) throw new Error('Stream request failed');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Add initial empty bot message to chat
      setChats(prev => prev.map(c => c.id === chatId ? {
        ...c,
        messages: [
          ...c.messages.map(m => m.status === 'delivered' ? { ...m, status: 'read' } : m),
          { id: botMsgId, role: 'bot', kind: 'text', content: '', timestamp: new Date() }
        ]
      } : c));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const data = JSON.parse(jsonStr);
              if (data.text) {
                streamText += data.text;
                const updatedContent = streamText;
                setChats(prev => prev.map(c => c.id === chatId ? {
                  ...c,
                  messages: c.messages.map(m => m.id === botMsgId ? { ...m, content: updatedContent } : m),
                  preview: updatedContent.replace(/\*\*/g, '').slice(0, 60),
                } : c));
              }
              if (data.escalated) {
                setChats(prev => prev.map(c => c.id === chatId ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: uid(), role: 'bot', kind: 'text',
                      content: '📩 **Your request has been flagged to our support team.** A TerraTrace advisor will reach out to you shortly via your registered contact details.',
                      timestamp: new Date()
                    }
                  ]
                } : c));
              }
            } catch (e) {}
          }
        }
      }
      setIsTyping(false);
    })
    .catch(err => {
      console.warn("AI Chatbot Stream failed, falling back to standard API/rule engine:", err);
      api.post('/chatbot/chat', { messages: historyToSend, fileContents })
      .then(res => {
        if (res.data && res.data.success) {
          const botMsg = {
            id: uid(), role: 'bot', kind: 'text',
            content: res.data.reply, timestamp: new Date()
          };
          const newMessages = [...res.data.reply ? [botMsg] : []];
          if (res.data.escalated) {
            newMessages.push({
              id: uid(), role: 'bot', kind: 'text',
              content: '📩 **Your request has been flagged to our support team.** A TerraTrace advisor will reach out to you shortly via your registered contact details.',
              timestamp: new Date(),
            });
          }
          setChats(prev => prev.map(c => c.id === chatId ? {
            ...c,
            messages: [
              ...c.messages.filter(m => m.id !== botMsgId).map(m => m.status === 'delivered' ? { ...m, status: 'read' } : m),
              ...newMessages,
            ],
            preview: botMsg.content.replace(/\*\*/g, '').slice(0, 60),
          } : c));
          setIsTyping(false);
        } else {
          throw new Error("Chatbot API response not successful");
        }
      })
      .catch(fallbackErr => {
        const reply = getBotReply(content, convState, dbPlots);
        updateConvState(chatId, reply.newState);
        const botMsg = {
          id: uid(), role: 'bot', kind: reply.plots ? 'plots' : 'text',
          content: reply.content, timestamp: new Date(),
          plots: reply.plots, quickReplies: reply.quickReplies,
        };
        setChats(prev => prev.map(c => c.id === chatId ? {
          ...c,
          messages: [
            ...c.messages.filter(m => m.id !== botMsgId).map(m => m.status === 'delivered' ? { ...m, status: 'read' } : m),
            botMsg,
          ],
          preview: botMsg.content.replace(/\*\*/g, '').slice(0, 60),
        } : c));
        setIsTyping(false);
      });
    });
  }, [input, pendingFiles, activeChatId, chats, convState, dbPlots, updateConvState]);

  const renameChat = useCallback((chatId, newTitle) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
  }, []);

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      const isImage = f.type.startsWith('image/');
      const kind = isImage ? 'image' : f.type === 'application/pdf' ? 'pdf' : f.name.match(/\.docx?$/i) ? 'doc' : 'other';
      const size = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
      const id = uid();
      const item = { id, name: f.name, size, kind, textContent: '' };

      if (!isImage) {
        const reader = new FileReader();
        reader.onload = (event) => {
          item.textContent = (event.target.result || '').slice(0, 15000); // Read up to 15KB text content
          setPendingFiles(prev => [...prev.filter(x => x.id !== id), item]);
        };
        reader.readAsText(f);
      } else {
        setPendingFiles(prev => [...prev, item]);
      }
    });
    e.target.value = '';
  };

  const selectChat = (id) => {
    setActiveChatId(id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const projectChats = (pid) => chats.filter(c => c.projectId === pid);

  if (!isEnabledGlobally) return null;

  return (
    <>
      {/* Floating logo trigger button placed at the right most edge */}
      <motion.button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-[22px] flex items-center justify-center shadow-2xl border-2 border-[#D4AF37] bg-[#002147]"
        whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(212,175,55,0.6)' }}
        whileTap={{ scale: 0.94 }}
        title="Open TerraTrace Land Advisor"
      >
        <LogoMark size={34} />
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#22c55e] border-[3px] border-[#002147]" />
      </motion.button>

      {/* Chatbot overlay - Covers the entire right-side Outlet page next to sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`fixed z-[200] flex flex-row overflow-hidden font-['Montserrat'] transition-all duration-300 shadow-2xl ${
              isExpanded 
                ? 'top-0 left-0 right-0 bottom-0 w-full h-full' 
                : 'top-0 right-0 bottom-0 w-full md:left-64 md:w-[calc(100%-256px)]'
            } ${
              isLightMode 
                ? 'bg-[#FAF8F5] text-[#2D2B2A]' 
                : 'bg-[#000c1e] text-white'
            }`}
          >
            {/* ── Sidebar (Conversation list pane) ── */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  initial={{ x: '-100%', width: 0 }}
                  animate={{ x: 0, width: 264 }}
                  exit={{ x: '-100%', width: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex-shrink-0 flex flex-col overflow-hidden h-full absolute md:relative z-[210] md:z-auto shadow-2xl md:shadow-none border-r transition-colors"
                  style={{
                    background: isLightMode ? '#F2EFE9' : '#001228',
                    borderColor: isLightMode ? '#E6E3DB' : 'rgba(212,175,55,0.1)'
                  }}
                >
                  {/* Sidebar header */}
                  <div className="flex items-center justify-between px-4 pt-6 pb-4 flex-shrink-0"
                    style={{ borderBottom: `1px solid ${isLightMode ? '#E0DBD3' : 'rgba(212,175,55,0.08)'}` }}>
                    <div className="flex items-center gap-2">
                      <LogoMark size={24} />
                      <div>
                        <div className={`text-xs font-bold leading-none ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}>
                          Terra<span style={{ color: '#D4AF37' }}>Trace</span>
                        </div>
                        <div className="text-[9px] mt-0.5 uppercase tracking-widest text-[#D4AF37]">Land Advisor</div>
                      </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className={`p-1 rounded transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'hover:bg-white/5 text-white/30 hover:text-white/70'}`}>
                      <X size={14} />
                    </button>
                  </div>

                  {/* Sidebar scroll area */}
                  <div className="flex-1 overflow-y-auto py-3 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
                    <SectionHeader label="Chats" count={chats.length} expanded={sections.chats}
                      onToggle={() => setSections(p => ({ ...p, chats: !p.chats }))} isLightMode={isLightMode} />
                    {sections.chats && chats.map(c => (
                      <ChatListItem key={c.id} chat={c} active={c.id === activeChatId} onSelect={() => selectChat(c.id)} onDelete={deleteChat} onRename={renameChat} isLightMode={isLightMode} />
                    ))}

                    <div className="mt-2">
                      <SectionHeader label="Projects" count={projects.length} expanded={sections.projects}
                        onToggle={() => setSections(p => ({ ...p, projects: !p.projects }))} isLightMode={isLightMode} />
                      {sections.projects && projects.map(proj => (
                        <div key={proj._id} className="group relative mx-2 mb-1 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all"
                          onClick={() => handleOpenProjectSidebar(proj)}
                          style={{
                            background: isLightMode ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.04)',
                            border: isLightMode ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(212,175,55,0.08)'
                          }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base flex-shrink-0">{proj.emoji || '\uD83D\uDCC1'}</span>
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-semibold truncate ${isLightMode ? 'text-[#2D2B2A]' : 'text-white/85'}`}>{proj.name}</div>
                            </div>
                            <FolderOpen size={13} className={isLightMode ? 'text-[#8C877D]' : 'text-white/30'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                    {/* Sidebar footer */}
                  <div className="px-3 pb-4 pt-3 space-y-2.5 flex-shrink-0 font-['Montserrat']"
                    style={{ borderTop: `1px solid ${isLightMode ? '#E0DBD3' : 'rgba(212,175,55,0.08)'}` }}>
                    {/* User profile card */}
                    <div className={`flex items-center justify-between p-2 rounded-xl mb-2 ${isLightMode ? 'bg-white border border-[#E0DBD3]' : 'bg-white/5 border border-white/5'}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#D4AF37] text-[#002147] flex-shrink-0">
                          {userInitials}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-[11px] font-bold truncate leading-tight ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}>{userName}</div>
                          <div className={`text-[9px] mt-0.5 leading-none ${isLightMode ? 'text-[#666259]' : 'text-white/45'}`}>{userRole}</div>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 border border-[#001228]" />
                    </div>

                    <button onClick={newChat}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-[#D4AF37] text-[#002147] transition-all hover:brightness-110 active:scale-95">
                      <Plus size={14} strokeWidth={2.5} />
                      New Chat
                    </button>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* ── Main chat area ── */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 transition-colors"
                style={{
                  background: isLightMode ? '#FAF8F5' : '#001228',
                  borderBottom: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.1)'
                }}>
                <div className="flex items-center gap-3">
                  {!sidebarOpen && (
                    <button onClick={() => setSidebarOpen(true)} className={`p-1.5 rounded-lg transition-colors ${isLightMode ? 'text-slate-500 hover:bg-slate-200/50' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>
                      <Menu size={16} />
                    </button>
                  )}
                  <div>
                    <h3 className={`text-sm font-semibold tracking-wide leading-none ${isLightMode ? 'text-[#2D2B2A]' : 'text-white/95'}`}>
                      {activeChat?.title || 'TerraTrace Advisor'}
                    </h3>
                    <div className="text-[10px] flex items-center gap-1.5 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className={isLightMode ? 'text-slate-500' : 'text-white/40'}>Land Recommendation Assistant · Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLightMode(prev => !prev)}
                    className={`p-2 rounded-lg transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/35 hover:text-[#D4AF37] hover:bg-white/5'}`}
                    title={isLightMode ? "Switch to Dark Blue Mode" : "Switch to Light Mode"}>
                    {isLightMode ? <Moon size={17} /> : <Sun size={17} />}
                  </button>
                  <button
                    onClick={() => setIsExpanded(prev => !prev)}
                    className={`p-2 rounded-lg transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/35 hover:text-[#D4AF37] hover:bg-white/5'}`}
                    title={isExpanded ? "Restore Normal View" : "Maximize Screen View"}>
                    {isExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                  </button>
                  <button onClick={() => setShowProjects(true)} className={`p-2 rounded-lg transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/35 hover:text-[#D4AF37] hover:bg-white/5'}`} title="My Projects">
                    <FolderOpen size={17} />
                  </button>
                  <button onClick={newChat} className={`p-2 rounded-lg transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/35 hover:text-[#D4AF37] hover:bg-white/5'}`} title="New Chat">
                    <MessageSquare size={17} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className={`p-2 rounded-lg transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/35 hover:text-white/80 hover:bg-white/5'}`} title="Close Advisor">
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Projects Panel overlay */}
              <ProjectsPanel
                isOpen={showProjects}
                onClose={() => setShowProjects(false)}
                authUser={authUser}
                projects={projects}
                setProjects={setProjects}
                activeProject={activeProject}
                setActiveProject={setActiveProject}
                loading={loadingProjects}
                loadProjects={loadProjects}
                isLightMode={isLightMode}
              />

              {/* Message Feed */}
              <div ref={messagesRef} onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
                style={{ scrollbarWidth: 'none' }}>
                <div className="flex items-center justify-center my-1">
                  <div className="px-3 py-1 rounded-full text-[9px] tracking-wider uppercase"
                    style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.22)' }}>
                    Live Registry Matching
                  </div>
                </div>

                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} playingId={playingId}
                    onPlayVoice={id => setPlayingId(prev => prev === id ? null : id)}
                    onQuickReply={qr => sendMessage(qr)}
                    userInitials={userInitials}
                    navigate={navigate}
                    setIsOpen={setIsOpen}
                    isLightMode={isLightMode} />
                ))}
                {isTyping && <TypingDots />}
                <div ref={endRef} />
              </div>

              {/* Scroll down button */}
              <AnimatePresence>
                {showDown && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 8 }}
                    onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="absolute bottom-24 right-6 w-9 h-9 rounded-full flex items-center justify-center shadow-xl bg-[#D4AF37] text-[#002147] hover:scale-105 active:scale-95"
                  >
                    <ArrowDown size={16} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* File drawer */}
              <AnimatePresence>
                {pendingFiles.length > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="px-6 py-2.5 flex gap-2 flex-wrap overflow-hidden"
                    style={{ borderTop: '1px solid rgba(212,175,55,0.08)', background: '#001228' }}>
                    {pendingFiles.map(f => (
                      <div key={f.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]"
                        style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
                        <FileKindIcon kind={f.kind} />
                        <span className="max-w-[120px] truncate font-medium">{f.name}</span>
                        <button onClick={() => setPendingFiles(p => p.filter(x => x.id !== f.id))}
                          className="text-white/40 hover:text-white/80 ml-1">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Bar */}
              <div className="px-6 py-4 flex-shrink-0 relative transition-colors"
                style={{
                  background: isLightMode ? '#FAF8F5' : '#001228',
                  borderTop: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.1)'
                }}>
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      disabled={isTyping}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isTyping) sendMessage();
                        }
                      }}
                      placeholder={isTyping ? "TerraTrace AI is responding..." : "Message TerraTrace Land Advisor..."}
                      className={`flex-1 max-h-28 min-h-[42px] py-3 px-4 rounded-xl text-xs leading-relaxed resize-none transition-all ${
                        isTyping ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isLightMode
                          ? 'bg-white text-[#2D2B2A] placeholder-[#8C877D] border border-[#D5D0C8] focus:border-[#D4AF37] focus:outline-none'
                          : 'bg-white/5 text-white placeholder-white/30 border border-white/10 focus:border-[#D4AF37] focus:outline-none'
                      }`}
                    />

                    <button
                      onClick={() => sendMessage()}
                      disabled={isTyping || (!input.trim() && pendingFiles.length === 0)}
                      className="flex-shrink-0 p-2.5 rounded-xl bg-[#D4AF37] text-[#002147] hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      <Send size={17} />
                    </button>
                  </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}