export type BooleanString = `${0 | 1}` | boolean;
export type InputPosition = 'top' | 'bottom';
export type Mapping = 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';

export default interface GiscusConfigs {
  themeURL: string;
  theme: string;
  darkTheme: string;
  mapping: Mapping;
  repo: `${string}/${string}`;
  repositoryId: string;
  category: string;
  categoryId: string;
  reactions: BooleanString;
  metadata: BooleanString;
  inputPosition: InputPosition;
  lang: string;
}
