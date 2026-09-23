import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  Building2, 
  Wheat, 
  ArrowUpRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Language, FarmerProfile } from '../types';
import { getFarmerTransactions, FarmerTransactionRecord } from '../lib/supabaseService';
import { DashboardHero } from './DashboardHero';
import { DashboardStatCard } from './DashboardStatCard';

interface FarmerTransactionsViewProps {
  farmer: FarmerProfile;
  language: Language;
  onOpenGatePass?: () => void;
}

export const FarmerTransactionsView: React.FC<FarmerTransactionsViewProps> = ({
  farmer,
  language,
}) => {
  const [transactions, setTransactions] = useState<FarmerTransactionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTxn, setSelectedTxn] = useState<FarmerTransactionRecord | null>(null);

  const isHindi = language === 'hi';

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getFarmerTransactions(farmer.id);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [farmer.id]);

  const uniqueCrops = Array.from(new Set(transactions.map(t => t.cropName)));

  const filtered = transactions.filter(t => {
    if (statusFilter !== 'all' && t.paymentStatus !== statusFilter) return false;
    if (cropFilter !== 'all' && t.cropName !== cropFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.cropName.toLowerCase().includes(q) ||
        t.buyerName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.paymentRef && t.paymentRef.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalEarnings = transactions
    .filter(t => t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const pendingAmount = transactions
    .filter(t => t.paymentStatus === 'pending')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      <DashboardHero
        badge={(
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800 text-amber-300 text-xs font-bold border border-emerald-600 mb-2">
              <Receipt className="w-4 h-4" />
              <span>{isHindi ? 'आधिकारिक APMC भुगतान व लेन-देन' : 'Official APMC Settlement & Receipts'}</span>
          </div>
        )}
        title={isHindi ? 'किसान लेन-देन इतिहास' : 'Farmer Transaction History'}
        subtitle={`${farmer.name} · ${farmer.bankAccountMasked} · Reg: ${farmer.registrationNo}`}
        actions={(
            <button
              onClick={loadTransactions}
              className="px-3.5 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-600/40 transition-colors cursor-pointer"
            >
              {isHindi ? 'ताज़ा करें' : 'Refresh Ledger'}
            </button>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardStatCard label={isHindi ? 'कुल प्राप्त राशि (बैंक में जमा)' : 'Total Disbursed (Paid to Bank)'} value={`₹${totalEarnings.toLocaleString('en-IN')}`} detail={`${transactions.filter(t => t.paymentStatus === 'paid').length} successful settlements`} />
        <DashboardStatCard label={isHindi ? 'प्रक्रियाधीन भुगतान (खरीदार देय)' : 'Pending Buyer Payments'} value={`₹${pendingAmount.toLocaleString('en-IN')}`} detail={`${transactions.filter(t => t.paymentStatus === 'pending').length} under APMC 2-hr SLA`} />
        <DashboardStatCard label={isHindi ? 'कुल बेची गई उपज' : 'Total Produce Sold'} value={`${transactions.reduce((sum, t) => sum + t.quantityQuintals, 0)} Qtl`} detail="Across APMC Karnal & Kurukshetra" />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={isHindi ? 'फसल, खरीदार का नाम, या संदर्भ संख्या खोजें...' : 'Search by crop, buyer name, or reference ID...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3C] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]"
            >
              <option value="all">{isHindi ? 'सभी स्थितियां' : 'All Statuses'}</option>
              <option value="paid">{isHindi ? '✅ प्राप्त (Paid)' : '✅ Paid / Received'}</option>
              <option value="pending">{isHindi ? '⏳ प्रक्रियाधीन (Pending)' : '⏳ Payment Pending'}</option>
              <option value="overdue">{isHindi ? '⚠️ अतिदेय (Overdue)' : '⚠️ Overdue'}</option>
            </select>

            {/* Crop Filter */}
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]"
            >
              <option value="all">{isHindi ? 'सभी फसलें' : 'All Crops'}</option>
              {uniqueCrops.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {isHindi ? 'लेन-देन विवरण' : 'Procurement Transactions List'}
            </h2>
            <p className="text-xs text-gray-500">
              {isHindi ? 'प्रत्येक तौल के बाद सीधे किसान के खाते में डीबीटी द्वारा भुगतान' : 'Direct benefit transfer payouts against electronic weighbridge J-Forms'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            {filtered.length} {isHindi ? 'प्रविष्टियां' : 'Records'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            {isHindi ? 'लेन-देन लोड हो रहे हैं...' : 'Loading transaction history...'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            {isHindi ? 'कोई लेन-देन नहीं मिला' : 'No transactions found matching your criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF6EE] text-gray-700 font-bold border-b border-[#E8DFC9]">
                <tr>
                  <th className="py-3 px-3.5">{isHindi ? 'दिनांक' : 'Date'}</th>
                  <th className="py-3 px-3.5">{isHindi ? 'फसल व ग्रेड' : 'Crop & Grade'}</th>
                  <th className="py-3 px-3.5">{isHindi ? 'मात्रा' : 'Quantity'}</th>
                  <th className="py-3 px-3.5">{isHindi ? 'खरीदार' : 'Buyer'}</th>
                  <th className="py-3 px-3.5">{isHindi ? 'दर (प्रति क्विंटल)' : 'Rate / Qtl'}</th>
                  <th className="py-3 px-3.5">{isHindi ? 'कुल राशि' : 'Total Amount'}</th>
                  <th className="py-3 px-3.5">{isHindi ? 'भुगतान स्थिति' : 'Payment Status'}</th>
                  <th className="py-3 px-3.5 text-right">{isHindi ? 'कार्रवाई' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((txn) => {
                  const isPaid = txn.paymentStatus === 'paid';
                  const isPending = txn.paymentStatus === 'pending';
                  const isOverdue = txn.paymentStatus === 'overdue';

                  return (
                    <tr key={txn.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 block">{txn.date}</span>
                        <span className="text-[11px] text-gray-400 font-mono">Token #{txn.tokenNumber}</span>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <Wheat className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <span className="font-bold text-gray-900 block">{txn.cropName}</span>
                            <span className="text-[11px] text-emerald-700 font-medium">
                              {txn.qualityGrade} · {txn.variety}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-gray-900 block">{txn.quantityQuintals} Quintals</span>
                        <span className="text-[11px] text-gray-500">{(txn.quantityQuintals * 100).toLocaleString('en-IN')} kg</span>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="font-semibold text-gray-800">{txn.buyerName}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 block">{txn.mandiCentreName}</span>
                      </td>

                      <td className="py-3.5 px-3.5 font-semibold text-gray-800 whitespace-nowrap">
                        ₹{txn.pricePerQuintal.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="text-sm font-black text-[#1B5E3C] block">
                          ₹{txn.totalAmount.toLocaleString('en-IN')}
                        </span>
                        {isPaid && (
                          <span className="text-[10px] text-emerald-700 font-mono">
                            Ref: {txn.paymentRef || 'DBT-PFMS'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            {isHindi ? 'खाते में प्राप्त' : '✅ Received'}
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-700" />
                            {isHindi ? 'भुगतान लंबित' : '⏳ Pending'}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-700" />
                            {isHindi ? 'अतिदेय (Overdue)' : '⚠️ Overdue'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTxn(txn)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isHindi ? 'J-Form रसीद' : 'View Slip'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slip / J-Form Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#1B5E3C]" />
                <h3 className="font-bold text-gray-900">
                  {isHindi ? 'आधिकारिक तौल पर्ची (J-Form)' : 'APMC Weighment Receipt (J-Form)'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#E8DFC9] space-y-2 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-gray-500">Transaction Ref:</span>
                <span className="font-bold text-gray-900">{selectedTxn.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mandi Yard:</span>
                <span className="font-bold text-gray-900">{selectedTxn.mandiCentreName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Farmer:</span>
                <span className="font-bold text-gray-900">{farmer.name} ({farmer.registrationNo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Buyer:</span>
                <span className="font-bold text-gray-900">{selectedTxn.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Commodity &amp; Grade:</span>
                <span className="font-bold text-[#1B5E3C]">{selectedTxn.cropName} ({selectedTxn.qualityGrade})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Net Quantity:</span>
                <span className="font-bold text-gray-900">{selectedTxn.quantityQuintals} Quintals ({(selectedTxn.quantityQuintals * 100).toLocaleString('en-IN')} kg)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rate per Quintal:</span>
                <span className="font-bold text-gray-900">₹{selectedTxn.pricePerQuintal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8DFC9] pt-2 text-sm">
                <span className="font-bold text-gray-900">Total Net Amount:</span>
                <span className="font-black text-[#1B5E3C]">₹{selectedTxn.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8DFC9] pt-2">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-bold capitalize text-emerald-800">
                  {selectedTxn.paymentStatus === 'paid' ? '✅ Disbursed to Bank' : '⏳ Pending from Buyer'}
                </span>
              </div>
              {selectedTxn.paymentRef && (
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-gray-500">Bank DBT Ref:</span>
                  <span className="font-bold text-gray-800">{selectedTxn.paymentRef}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  alert(isHindi ? 'J-Form रसीद डाउनलोड प्रारंभ...' : 'Downloading J-Form PDF...');
                  setSelectedTxn(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isHindi ? 'J-Form रसीद डाउनलोड करें' : 'Download J-Form'}</span>
              </button>
              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold cursor-pointer"
              >
                {isHindi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
