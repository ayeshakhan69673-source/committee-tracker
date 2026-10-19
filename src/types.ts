export type Member = {
  id: string;
  name: string;
  phone: string; // optional, may be empty
};

export type Committee = {
  id: string;
  name: string;
  monthlyAmount: number;
  startYear: number;
  startMonth: number; // 0 = January ... 11 = December
  dueDay: number; // day of the month payments are due (1-28)
  members: Member[];
  payoutOrder: string[]; // member ids; position = month number (0 = first month)
  paid: Record<string, string>; // "monthIndex:memberId" -> ISO date the payment was marked
  icon?: string; // one of COMMITTEE_ICONS (older saved data may not have it)
  accent?: string; // id of an accent in ACCENTS
  createdAt: string;
};