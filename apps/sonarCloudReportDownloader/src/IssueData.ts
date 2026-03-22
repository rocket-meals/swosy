/**
 * Shared interface representing common issue fields used across
 * SonarCloud report downloading and issue markdown generation.
 */
export interface IssueData {
  key: string;
  message: string;
  component: string;
  line?: number;
}
