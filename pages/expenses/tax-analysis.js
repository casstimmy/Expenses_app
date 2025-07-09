import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScaleBalanced,
  faMoneyBillWave,
  faFileDownload,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

// Utility: Determine Tax Band
const getTaxBand = (revenue) => {
  if (revenue <= 25_000_000) return { band: "Small", rate: 0 };
  if (revenue <= 100_000_000) return { band: "Medium", rate: 20 };
  return { band: "Large", rate: 30 };
};

export default function TaxAnalysisPage() {
  const [taxData, setTaxData] = useState(null);

  useEffect(() => {
    const mockRevenue = 78_500_000;

    const taxBandInfo = getTaxBand(mockRevenue);
    const vatRate = 7.5;

    const taxableIncome = mockRevenue * 0.85;
    const companyIncomeTax = (taxableIncome * taxBandInfo.rate) / 100;
    const vatOnSales = (mockRevenue * vatRate) / 100;

    setTaxData({
      totalRevenue: mockRevenue,
      band: taxBandInfo.band,
      citRate: taxBandInfo.rate,
      taxableIncome,
      companyIncomeTax,
      vatOnSales,
      breakdown: [
        { month: "January", income: 8000000, vat: 600000 },
        { month: "February", income: 5200000, vat: 390000 },
        { month: "March", income: 4500000, vat: 337500 },
      ],
    });
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-6">
            Tax Analysis Dashboard
          </h1>
          <p className="text-gray-600 mb-8">
            Summary of tax performance and obligations according to the Nigeria
            Finance Act.
          </p>

          {!taxData ? (
            <p className="text-gray-500">Loading tax data...</p>
          ) : (
            <>
              {/* Stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatBox
                  icon={faScaleBalanced}
                  label="Revenue Band"
                  value={taxData.band}
                  color="bg-blue-100"
                />
                <StatBox
                  icon={faChartLine}
                  label="CIT Rate"
                  value={`${taxData.citRate}%`}
                  color="bg-yellow-100"
                />
                <StatBox
                  icon={faMoneyBillWave}
                  label="VAT on Sales"
                  value={`₦${taxData.vatOnSales.toLocaleString()}`}
                  color="bg-green-100"
                />
                <StatBox
                  icon={faMoneyBillWave}
                  label="CIT Payable"
                  value={`₦${taxData.companyIncomeTax.toLocaleString()}`}
                  color="bg-red-100"
                />
              </div>

              {/* Income Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <DetailBox
                  label="Total Revenue"
                  value={`₦${taxData.totalRevenue.toLocaleString()}`}
                />
                <DetailBox
                  label="Estimated Taxable Income"
                  value={`₦${taxData.taxableIncome.toLocaleString()}`}
                />
              </div>

              {/* Breakdown Table */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-3 text-gray-700">
                  Monthly VAT Breakdown
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 text-sm shadow-sm">
                    <thead>
                      <tr className="bg-gray-100 text-left text-gray-700 uppercase tracking-wider">
                        <th className="py-2 px-4 border-b">Month</th>
                        <th className="py-2 px-4 border-b">Income (₦)</th>
                        <th className="py-2 px-4 border-b">VAT (₦)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxData.breakdown.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">{item.month}</td>
                          <td className="py-2 px-4 border-b">
                            {item.income.toLocaleString()}
                          </td>
                          <td className="py-2 px-4 border-b">
                            {item.vat.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => alert("Tax Report downloaded")}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded shadow hover:bg-green-700 transition"
                >
                  <FontAwesomeIcon icon={faFileDownload} />
                  Download Tax Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className={`p-4 rounded shadow ${color} flex items-center gap-3`}>
      <div className="text-xl text-gray-700">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
