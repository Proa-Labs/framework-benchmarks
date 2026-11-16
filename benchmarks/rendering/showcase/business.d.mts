export function semantic(html: string, allowedData?: Set<string>): {
  text: string;
  images: (string | undefined)[];
  links: (string | undefined)[];
  data: [string, string][][];
};
