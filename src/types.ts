export type CrawlerRequest = {
  // The absolute URL to crawl.
  url: string;
  // Options to forward to the driver.
  options?: DriverOptions;
  // Any other properties the user wants to add.
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

type DriverOptions = Record<string, unknown>;

export interface Driver<
  ResponseType extends DriverResponse = DriverResponse,
  OptionsType extends DriverOptions = {}
> {
  (url: string, options?: DriverOptions): Promise<ResponseType>;
}
