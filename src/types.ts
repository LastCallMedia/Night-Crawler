export type CrawlerRequest = {
  url: string;
  driverOptions?: unknown;
  groups?: string[];
  [key: string]: unknown;
};

export type DriverResponse = {
  statusCode: number;
  time: number;
  [key: string]: unknown;
};
export type CrawlerResponse = DriverResponse;

export type CrawlerUnit = {
  error?: string | Error;
  request: CrawlerRequest;
  response?: CrawlerResponse;
};

export interface Driver<
  ResponseType extends CrawlerResponse = CrawlerResponse
> {
  /**
   * Fetch a single URL.
   *
   * The driver should return a promise which is only rejected in the case
   * where the response is a complete error.
   */
  fetch(req: CrawlerRequest): Promise<ResponseType>;
}
