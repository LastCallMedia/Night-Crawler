export type CrawlerRequest = {
  url: string;
  driverOptions?: {};
  groups?: string[];
  [key: string]: unknown;
};

export type RequestIterable =
  | Iterable<CrawlerRequest>
  | AsyncIterable<CrawlerRequest>;

export type DriverResponse = {
  statusCode: number;
  time: number;
};

export type CrawlerUnit = {
  error?: string | Error;
  request: CrawlerRequest;
  response?: DriverResponse;
};

export interface Driver<ResponseType extends DriverResponse = DriverResponse> {
  /**
   * Fetch a single URL.
   *
   * The driver should return a promise which is only rejected in the case
   * where the response is a complete error.
   */
  fetch(req: CrawlerRequest): Promise<ResponseType>;
}
