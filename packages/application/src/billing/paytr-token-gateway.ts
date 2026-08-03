export type PaytrTokenRequest = {
  readonly merchantOid: string;
  readonly email: string;
  readonly paymentAmountKurus: number;
  readonly userBasket: string;
  readonly userName: string;
  readonly userAddress: string;
  readonly userPhone: string;
  readonly userIp: string;
  readonly merchantOkUrl: string;
  readonly merchantFailUrl: string;
};

export interface PaytrTokenGateway {
  getIframeToken(request: PaytrTokenRequest): Promise<string>;
}
