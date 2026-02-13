"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CounselingFormData, Customer, AITreatmentPlan } from '@/lib/types';

interface CounselingContextType {
  currentCustomer: Customer | null;
  formData: CounselingFormData;
  setFormData: React.Dispatch<React.SetStateAction<CounselingFormData>>;
  setCurrentCustomer: (customer: Customer) => void;
  resetSession: () => void;
  updateSectionData: (section: 'root' | 'middle' | 'ends', field: string, value: any) => void;
}

const initialFormData: CounselingFormData = {
  customerId: '',
  hairConditionBefore: {
    root: { damage: 3, curl: 'straight' },
    middle: { damage: 3, curl: 'straight' },
    ends: { damage: 3, curl: 'straight' },
  },
  treatmentHistory: {
    lastColor: 'none',
    bleachCount: 'none',
    hasStraitening: false,
  },
  staffAssessment: {
    assessmentNotes: '',
    concerns: '',
    customerRequests: '',
  },
};

const CounselingContext = createContext<CounselingContextType | undefined>(undefined);

export function CounselingProvider({ children }: { children: ReactNode }) {
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CounselingFormData>(initialFormData);

  const resetSession = () => {
    setFormData(initialFormData);
    setCurrentCustomer(null);
  };

  const updateSectionData = (section: 'root' | 'middle' | 'ends', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      hairConditionBefore: {
        ...prev.hairConditionBefore,
        [section]: {
          ...prev.hairConditionBefore[section],
          [field]: value
        }
      }
    }));
  };

  return (
    <CounselingContext.Provider value={{ 
      currentCustomer, 
      formData, 
      setFormData, 
      setCurrentCustomer, 
      resetSession, 
      updateSectionData 
    }}>
      {children}
    </CounselingContext.Provider>
  );
}

export function useCounseling() {
  const context = useContext(CounselingContext);
  if (!context) {
    throw new Error('useCounseling must be used within a CounselingProvider');
  }
  return context;
}
