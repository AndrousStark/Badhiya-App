/**
 * SheetProvider — global bottom sheet manager.
 *
 * Lets any component open one of the registered sheets via `useSheets()`.
 * Avoids prop-drilling and ensures only ONE sheet is visible at a time.
 *
 * Registered sheets (Phase 4–6):
 *   - voice           — VoiceInputSheet
 *   - record-sale     — RecordSaleSheet
 *   - give-credit     — GiveCreditSheet
 *   - receive-payment — ReceivePaymentSheet
 *   - add-product     — AddProductSheet
 *   - stock-update    — StockUpdateSheet
 *
 * Usage:
 *   const { openVoice, openAddProduct, openStockUpdate } = useSheets();
 *   openAddProduct({ initialBarcode: '8901030875505' });
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { VoiceInputSheet, type VoiceInputProps } from './VoiceInputSheet';
import { RecordSaleSheet, type RecordSaleProps } from './RecordSaleSheet';
import { GiveCreditSheet, type GiveCreditProps } from './GiveCreditSheet';
import {
  ReceivePaymentSheet,
  type ReceivePaymentProps,
} from './ReceivePaymentSheet';
import { AddProductSheet, type AddProductProps } from './AddProductSheet';
import {
  StockUpdateSheet,
  type StockUpdateProps,
} from './StockUpdateSheet';
import {
  NotificationsSheet,
  type NotificationsSheetProps,
} from './NotificationsSheet';
import { SearchSheet, type SearchSheetProps } from './SearchSheet';
import {
  LoanApplicationSheet,
  type LoanApplicationProps,
} from './LoanApplicationSheet';
import {
  RegisterOndcSellerSheet,
  type RegisterOndcSellerProps,
} from './RegisterOndcSellerSheet';
import {
  AddTeamMemberSheet,
  type AddTeamMemberProps,
} from './AddTeamMemberSheet';

type SheetType =
  | 'voice'
  | 'record-sale'
  | 'give-credit'
  | 'receive-payment'
  | 'add-product'
  | 'stock-update'
  | 'notifications'
  | 'search'
  | 'loan-application'
  | 'register-ondc'
  | 'add-team-member'
  | null;

interface SheetState {
  type: SheetType;
  voiceProps?: Omit<VoiceInputProps, 'visible' | 'onClose'>;
  recordSaleProps?: Omit<RecordSaleProps, 'visible' | 'onClose'>;
  giveCreditProps?: Omit<GiveCreditProps, 'visible' | 'onClose'>;
  receivePaymentProps?: Omit<ReceivePaymentProps, 'visible' | 'onClose'>;
  addProductProps?: Omit<AddProductProps, 'visible' | 'onClose'>;
  stockUpdateProps?: Omit<StockUpdateProps, 'visible' | 'onClose'>;
  loanApplicationProps?: Omit<LoanApplicationProps, 'visible' | 'onClose'>;
}

interface SheetContextValue {
  openVoice: (props?: Omit<VoiceInputProps, 'visible' | 'onClose'>) => void;
  openRecordSale: (
    props: Omit<RecordSaleProps, 'visible' | 'onClose'>,
  ) => void;
  openGiveCredit: (
    props?: Omit<GiveCreditProps, 'visible' | 'onClose'>,
  ) => void;
  openReceivePayment: (
    props: Omit<ReceivePaymentProps, 'visible' | 'onClose'>,
  ) => void;
  openAddProduct: (
    props?: Omit<AddProductProps, 'visible' | 'onClose'>,
  ) => void;
  openStockUpdate: (
    props: Omit<StockUpdateProps, 'visible' | 'onClose'>,
  ) => void;
  openNotifications: () => void;
  openSearch: () => void;
  openLoanApplication: (
    props: Omit<LoanApplicationProps, 'visible' | 'onClose'>,
  ) => void;
  openRegisterOndc: () => void;
  openAddTeamMember: () => void;
  close: () => void;
  current: SheetType;
}

const SheetContext = createContext<SheetContextValue | null>(null);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SheetState>({ type: null });

  const openVoice = useCallback(
    (props?: Omit<VoiceInputProps, 'visible' | 'onClose'>) => {
      setState({ type: 'voice', voiceProps: props });
    },
    [],
  );

  const openRecordSale = useCallback(
    (props: Omit<RecordSaleProps, 'visible' | 'onClose'>) => {
      setState({ type: 'record-sale', recordSaleProps: props });
    },
    [],
  );

  const openGiveCredit = useCallback(
    (props?: Omit<GiveCreditProps, 'visible' | 'onClose'>) => {
      setState({ type: 'give-credit', giveCreditProps: props });
    },
    [],
  );

  const openReceivePayment = useCallback(
    (props: Omit<ReceivePaymentProps, 'visible' | 'onClose'>) => {
      setState({ type: 'receive-payment', receivePaymentProps: props });
    },
    [],
  );

  const openAddProduct = useCallback(
    (props?: Omit<AddProductProps, 'visible' | 'onClose'>) => {
      setState({ type: 'add-product', addProductProps: props });
    },
    [],
  );

  const openStockUpdate = useCallback(
    (props: Omit<StockUpdateProps, 'visible' | 'onClose'>) => {
      setState({ type: 'stock-update', stockUpdateProps: props });
    },
    [],
  );

  const openNotifications = useCallback(() => {
    setState({ type: 'notifications' });
  }, []);

  const openSearch = useCallback(() => {
    setState({ type: 'search' });
  }, []);

  const openLoanApplication = useCallback(
    (props: Omit<LoanApplicationProps, 'visible' | 'onClose'>) => {
      setState({ type: 'loan-application', loanApplicationProps: props });
    },
    [],
  );

  const openRegisterOndc = useCallback(() => {
    setState({ type: 'register-ondc' });
  }, []);

  const openAddTeamMember = useCallback(() => {
    setState({ type: 'add-team-member' });
  }, []);

  const close = useCallback(() => {
    setState({ type: null });
  }, []);

  return (
    <SheetContext.Provider
      value={{
        openVoice,
        openRecordSale,
        openGiveCredit,
        openReceivePayment,
        openAddProduct,
        openStockUpdate,
        openNotifications,
        openSearch,
        openLoanApplication,
        openRegisterOndc,
        openAddTeamMember,
        close,
        current: state.type,
      }}
    >
      {children}
      <VoiceInputSheet
        visible={state.type === 'voice'}
        onClose={close}
        {...state.voiceProps}
      />
      <RecordSaleSheet
        visible={state.type === 'record-sale'}
        onClose={close}
        {...state.recordSaleProps}
      />
      <GiveCreditSheet
        visible={state.type === 'give-credit'}
        onClose={close}
        {...state.giveCreditProps}
      />
      {state.receivePaymentProps && (
        <ReceivePaymentSheet
          visible={state.type === 'receive-payment'}
          onClose={close}
          customerId={state.receivePaymentProps.customerId}
          customerName={state.receivePaymentProps.customerName}
          outstanding={state.receivePaymentProps.outstanding}
        />
      )}
      <AddProductSheet
        visible={state.type === 'add-product'}
        onClose={close}
        {...state.addProductProps}
      />
      {state.stockUpdateProps && (
        <StockUpdateSheet
          visible={state.type === 'stock-update'}
          onClose={close}
          productId={state.stockUpdateProps.productId}
          productName={state.stockUpdateProps.productName}
          currentStock={state.stockUpdateProps.currentStock}
          lowStockThreshold={state.stockUpdateProps.lowStockThreshold}
        />
      )}
      <NotificationsSheet
        visible={state.type === 'notifications'}
        onClose={close}
      />
      <SearchSheet visible={state.type === 'search'} onClose={close} />
      {state.loanApplicationProps && (
        <LoanApplicationSheet
          visible={state.type === 'loan-application'}
          onClose={close}
          nbfcCode={state.loanApplicationProps.nbfcCode}
          maxAmount={state.loanApplicationProps.maxAmount}
          indicativeRate={state.loanApplicationProps.indicativeRate}
          offerId={state.loanApplicationProps.offerId}
        />
      )}
      <RegisterOndcSellerSheet
        visible={state.type === 'register-ondc'}
        onClose={close}
      />
      <AddTeamMemberSheet
        visible={state.type === 'add-team-member'}
        onClose={close}
      />
    </SheetContext.Provider>
  );
}

export function useSheets(): SheetContextValue {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('useSheets must be used inside <SheetProvider>');
  return ctx;
}
