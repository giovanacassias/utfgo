export interface MeetingPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
}

export type CreateMeetingPointPayload = Omit<MeetingPoint, 'id' | 'createdAt'>;

export type MeetingPointFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean | string;
}

export interface CepAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const CEP_NOT_FOUND_ERROR = 'CEP não encontrado. Verifique o número digitado.';
export const CEP_NETWORK_ERROR = 'Serviço de consulta de CEP indisponível. Preencha o endereço manualmente.';
