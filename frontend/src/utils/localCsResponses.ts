type SuggestedAction = { text: string; url?: string };

export type LocalCsResponse = {
  content: string;
  suggestedActions: SuggestedAction[];
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const hasAny = (value: string, keywords: string[]) => {
  const normalized = normalize(value);
  const tokens = new Set(normalized.split(' ').filter(Boolean));

  return keywords.some(keyword => {
    const k = normalize(keyword);
    if (!k) return false;
    if (!k.includes(' ') && k.length <= 3) return tokens.has(k);
    return normalized.includes(k);
  });
};

const withGuestHook = (response: LocalCsResponse, message: string): LocalCsResponse => {
  const normalized = normalize(message);
  const isGreeting = hasAny(normalized, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']);

  if (!isGreeting) return response;

  return {
    ...response,
    content: `${response.content}\n\n(Drop your email to save this chat before you close the tab.)`
  };
};

export const getLocalCsResponse = (message: string): LocalCsResponse => {
  const normalized = normalize(message);

  if (hasAny(normalized, ['quality assurance', 'qa process', 'qc checklist', 'quality control', 'checks', 'how is quality verified'])) {
    return {
      content: "Every image goes through two manual checks before delivery. Senior editors verify each file against checklists covering edge precision, lighting, and color accuracy.\n\nSee the [QA Process](/quality-assurance-process) or try 3 free edits and judge the results yourself.",
      suggestedActions: [
        { text: 'View QA Process', url: '/quality-assurance-process' },
        { text: 'Start Free Trial', url: '/free-trial' },
        { text: 'Book a Call', url: '/book-meeting' }
      ]
    };
  }

  if (hasAny(normalized, ['get a quote', 'quote', 'price', 'pricing', 'cost', 'rates'])) {
    return {
      content: "Pricing depends on service type, complexity, volume, and turnaround speed.\n\nSee the full breakdown on [Pricing](/pricing), or share your brief on [Free Trial](/free-trial) and we'll quote your project.",
      suggestedActions: [
        { text: 'View Pricing', url: '/pricing' },
        { text: 'Get Pricing Breakdown', url: '/free-trial' },
        { text: 'Book a Call', url: '/book-meeting' }
      ]
    };
  }

  if (hasAny(normalized, ['service', 'services', 'what do you do', 'offerings', 'catalog'])) {
    return {
      content: "We do professional photo editing for ecommerce — **background removal**, **retouching**, **ghost mannequin**, **color correction**, clipping paths, and batch editing.\n\nFull list: [Services](/services).",
      suggestedActions: [
        { text: 'Browse Services', url: '/services' },
        { text: 'View Pricing', url: '/pricing' },
        { text: 'Start Free Trial', url: '/free-trial' }
      ]
    };
  }

  if (hasAny(normalized, ['free trial', 'sample', 'demo', 'test edit', 'try free'])) {
    return {
      content: "Send 3 images on the [Free Trial](/free-trial) page. No credit card. We'll return the edited files within 24 hours.",
      suggestedActions: [
        { text: 'Start Free Trial', url: '/free-trial' },
        { text: 'Browse Services', url: '/services' }
      ]
    };
  }

  if (hasAny(normalized, ['turnaround', 'delivery', 'how long', 'urgent', 'rush', 'deadline'])) {
    return {
      content: "Turnaround ranges from 12 hours (express) up to 7 days (economy) depending on image count, complexity, and the speed you pick. Compare options on [Pricing](/pricing).",
      suggestedActions: [
        { text: 'View Turnaround Options', url: '/pricing' },
        { text: 'Start a Project', url: '/dashboard?view=new-project' },
        { text: 'Book a Call', url: '/book-meeting' }
      ]
    };
  }

  if (hasAny(normalized, ['human', 'agent', 'contact', 'support', 'talk to', 'speak to', 'email'])) {
    return {
      content: "Book a call or drop your email and we'll reply directly.",
      suggestedActions: [
        { text: 'Book a Meeting', url: '/book-meeting' },
        { text: 'Browse FAQ', url: '/blog' }
      ]
    };
  }

  if (hasAny(normalized, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
    return withGuestHook({
      content: "Hi. Ask me about pricing, services, or turnaround. Or start a project.",
      suggestedActions: [
        { text: 'Get Pricing Breakdown', url: '/free-trial' },
        { text: 'Our Services', url: '/services' },
        { text: 'Pricing Bundles', url: '/pricing' }
      ]
    }, message);
  }

  return {
    content: "I can help with **pricing**, **services**, **turnaround**, or starting a project. What do you need?",
    suggestedActions: [
      { text: 'Browse Services', url: '/services' },
      { text: 'View Pricing', url: '/pricing' },
      { text: 'Book a Call', url: '/book-meeting' }
    ]
  };
};
