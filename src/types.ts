export type CrawlRequest = {
  url: string;
  [key: string]: unknown;
};

export type CrawlResponse = {
  url: string;
  error: boolean;
  [key: string]: unknown;
};

export type CrawlReport = {
  name: string;
  date: Date;
  data: Array<CrawlResponse>;
};

export type DriverResponse = Record<string, unknown>;

export interface Driver<ResponseType extends DriverResponse = DriverResponse> {
  /**
   * Fetch a single URL.
   *
   * The driver should return a promise which is only rejected in the case
   * where the response is a complete error.
   */
  fetch(req: CrawlRequest): Promise<ResponseType>;

  /**
   * Collect data about a response.
   *
   * A driver may provide default data about the response, which is merged
   * into the collected data the crawler itself gathers.
   */
  collect(response: ResponseType): Record<string, unknown>;
}