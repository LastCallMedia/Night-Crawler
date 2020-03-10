export type CrawlerRequest = {
  url: string;
  driverOptions?: unknown;
  groups?: string[]
  [key: string]: unknown;
};

export type CrawlerResponse = {
  url: string;
  groups?: []
  error?: Error;
  [key: string]: unknown;
};

export type DriverResponse = {
  statusCode: number;
};

export interface Driver<ResponseType extends DriverResponse = DriverResponse> {
  /**
   * Fetch a single URL.
   *
   * The driver should return a promise which is only rejected in the case
   * where the response is a complete error.
   */
  fetch(req: CrawlerRequest): Promise<ResponseType>;

  /**
   * Collect data about a response.
   *
   * A driver may provide default data about the response, which is merged
   * into the collected data the crawler itself gathers.
   */
  collect(response: ResponseType): Record<string, unknown>;
}
