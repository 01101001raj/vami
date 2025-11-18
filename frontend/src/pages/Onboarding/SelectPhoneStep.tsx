import React, { useEffect, useState } from 'react';
import { Phone, Search, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface PhoneNumber {
  phone_number: string;
  phone_number_sid: string;
  friendly_name: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
  is_assigned: boolean;
}

interface SelectPhoneStepProps {
  onSelect: (phoneNumber: string, phoneSid: string) => void;
  selectedPhone?: string;
}

const SelectPhoneStep: React.FC<SelectPhoneStepProps> = ({ onSelect, selectedPhone }) => {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchArea, setSearchArea] = useState('');

  useEffect(() => {
    fetchAvailableNumbers();
  }, []);

  const fetchAvailableNumbers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/phone-numbers/available');
      setPhoneNumbers(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  };

  const filteredNumbers = phoneNumbers.filter(num =>
    searchArea ? num.phone_number.includes(searchArea) : true
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAvailableNumbers}
          className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Choose Your Phone Number
        </h2>
        <p className="text-slate-600">
          Select a phone number for your AI agent. This number will receive all incoming calls.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by area code or number..."
          value={searchArea}
          onChange={(e) => setSearchArea(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Phone Number Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {filteredNumbers.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-slate-500">
            No available phone numbers found. Please contact support.
          </div>
        ) : (
          filteredNumbers.map((number) => (
            <button
              key={number.phone_number_sid}
              onClick={() => onSelect(number.phone_number, number.phone_number_sid)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${selectedPhone === number.phone_number
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${selectedPhone === number.phone_number ? 'bg-emerald-500' : 'bg-slate-200'}
                `}>
                  <Phone className={`w-5 h-5 ${selectedPhone === number.phone_number ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-lg">
                    {number.phone_number}
                  </div>
                  {number.friendly_name && (
                    <div className="text-sm text-slate-500 mt-1">
                      {number.friendly_name}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {number.capabilities.voice && (
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                        Voice
                      </span>
                    )}
                    {number.capabilities.sms && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        SMS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedPhone && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-emerald-800 font-medium">
            Selected: {selectedPhone}
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectPhoneStep;
