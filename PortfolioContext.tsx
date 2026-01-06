import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  auth, 
  db, 
  onAuthStateChanged,
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  serverTimestamp 
} from './firebase';
import { Folio, UserProfile } from './types';
import { MOCK_USER } from './constants';

interface PortfolioContextType {
  folios: Folio[];
  user: UserProfile;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  formatCurrency: (amount: number | string | undefined) => string;
  addFolio: (params: { 
    schemeCode: string; 
    schemeName: string; 
    planType?: 'Regular' | 'Direct';
    investmentType?: 'SIP' | 'Lumpsum';
    amount?: number;
    units?: number;
    sipDate?: number;
  }) => Promise<void>;
  removeFolio: (id: string) => Promise<void>;
  sellUnits: (id: string, units: number) => Promise<void>;
  investMore: (id: string, amount: number, units: number, investmentType?: 'SIP' | 'Lumpsum', sipDate?: number) => Promise<void>;
  quickTransaction: (id: string, type: 'BUY' | 'SELL', currentNav: number) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [folios, setFolios] = useState<Folio[]>([]);
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number | string | undefined): string => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (val === undefined || isNaN(val)) return '₹0.00';
    return `₹${val.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser: any) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const userDocRef = doc(db, 'users', fUser.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          setUser(userSnap.data() as UserProfile);
        } else {
          const newUser = { 
            ...MOCK_USER, 
            email: fUser.email || 'guest@finwave.demo', 
            name: fUser.displayName || 'Guest User' 
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);
        }

        const foliosQ = query(collection(db, 'folios'), where('userId', '==', fUser.uid));
        const unsubscribeFolios = onSnapshot(foliosQ, (snapshot: any) => {
          const fetchedFolios = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as Folio[];
          setFolios(fetchedFolios);
        });

        setLoading(false);
        return () => unsubscribeFolios();
      } else {
        setFolios([]);
        setUser(MOCK_USER);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, updates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  const addFolio = async (params: any) => {
    if (!firebaseUser) return;
    const exists = folios.find(f => f.schemeCode === params.schemeCode);
    if (exists) return;

    const plan = params.planType || 'Direct';
    const amountValue = roundToTwo(params.amount || 2500);
    
    await addDoc(collection(db, 'folios'), {
      userId: firebaseUser.uid,
      schemeCode: params.schemeCode,
      schemeName: params.schemeName.includes('Plan') ? params.schemeName : `${params.schemeName} - ${plan} Plan`,
      folioNumber: `${Math.floor(10000000 + Math.random() * 90000000)}/01`,
      investmentType: params.investmentType || 'Lumpsum',
      sipDate: params.sipDate || null,
      planType: plan,
      units: params.units || 50,
      investedValue: amountValue,
      createdAt: serverTimestamp()
    });
  };

  const removeFolio = async (id: string) => {
    if (!firebaseUser) return;
    if (window.confirm("Remove this scheme from your portfolio?")) {
      await deleteDoc(doc(db, 'folios', id));
    }
  };

  const sellUnits = async (id: string, unitsToSell: number) => {
    if (!firebaseUser) return;
    const target = folios.find(f => f.id === id);
    if (!target) return;

    const remainingUnits = target.units - unitsToSell;
    if (remainingUnits < 0) return;
    
    const folioRef = doc(db, 'folios', id);
    if (remainingUnits < 0.001) {
      await deleteDoc(folioRef);
    } else {
      const ratio = remainingUnits / target.units;
      await updateDoc(folioRef, {
        units: remainingUnits,
        investedValue: roundToTwo(target.investedValue * ratio)
      });
    }
  };

  const investMore = async (id: string, amount: number, units: number, investmentType?: any, sipDate?: number) => {
    if (!firebaseUser) return;
    const target = folios.find(f => f.id === id);
    if (!target) return;

    const folioRef = doc(db, 'folios', id);
    await updateDoc(folioRef, {
      units: target.units + units,
      investedValue: roundToTwo(target.investedValue + amount),
      investmentType: investmentType || target.investmentType,
      sipDate: sipDate !== undefined ? sipDate : (target.sipDate || null)
    });
  };

  const quickTransaction = async (id: string, type: 'BUY' | 'SELL', currentNav: number) => {
    const TRANSACTION_AMOUNT = 5000;
    const units = TRANSACTION_AMOUNT / currentNav;

    if (type === 'BUY') {
      await investMore(id, TRANSACTION_AMOUNT, units);
    } else {
      const target = folios.find(f => f.id === id);
      if (target && target.units >= units) {
        await sellUnits(id, units);
      } else if (target) {
        await sellUnits(id, target.units);
      }
    }
  };

  return (
    <PortfolioContext.Provider value={{ 
      folios, 
      user, 
      firebaseUser, 
      loading, 
      updateUser, 
      formatCurrency,
      addFolio, 
      removeFolio, 
      sellUnits, 
      investMore, 
      quickTransaction 
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error("usePortfolio must be used within PortfolioProvider");
  return context;
};
