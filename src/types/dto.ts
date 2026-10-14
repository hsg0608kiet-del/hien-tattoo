export interface RegisterUserDTO {
  name: string;
  phone: string;
  password?: string;
  email?: string;
  role?: 'CLIENT' | 'ADMIN';
}

export interface CreatePortfolioItemDTO {
  title: string;
  imageUrl: string;
  style?: string;
  placement?: string;
  description?: string;
  estimatedPrice: number;
  estimatedDuration: number; // in minutes
  isFlash?: boolean;
}

export interface CreateCustomRequestDTO {
  images: string[]; // Array of image URLs / Base64
  description: string;
  placement: string;
  size: string;
}

export interface QuoteCustomRequestDTO {
  quotedPrice: number;
  estimatedDuration: number; // in minutes
  adminNote?: string;
}

export interface CreateBookingDTO {
  portfolioItemId?: string;
  customRequestId?: string;
  serviceType?: string;
  totalPrice: number;
  depositAmount: number;
  durationMin: number;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface UpdateBookingStatusDTO {
  action: 'APPROVE' | 'REJECT' | 'CANCEL' | 'COMPLETE' | 'ACCEPT_QUOTE';
  rejectReason?: string;
}
