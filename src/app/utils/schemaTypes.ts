export interface User {
  id: string;
  studentNo: string;
  name: string;
  createdAt: Date;

  booths?: Booth[]; // 운영하는 부스들
  applications?: Application[];
}

export interface Booth {
  id: string;
  name: string;
  description?: string | null;
  operatorId: string;
  operator?: User; // 참조(옵션)
  where: string;
  startAt: Date;
  endAt: Date;
  slotInterval: number;
  capacity: number;
  createdAt: Date;

  applications?: Application[];
}

export interface Application {
  id: string;
  boothId: string;
  booth?: Booth; // 참조(옵션)
  userId: string;
  user?: User; // 참조(옵션)
  slotIndex: number;
  isAccepted: boolean;
  createdAt: Date;
}
