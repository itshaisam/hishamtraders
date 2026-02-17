"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Calculator } from "lucide-react";

export default function ROICalculatorPage() {
  const [employees, setEmployees] = useState<number>(10);
  const [reportingHours, setReportingHours] = useState<number>(5);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(500000);
  const [showResults, setShowResults] = useState(false);

  const calculate = () => {
    setShowResults(true);
  };

  const hoursSavedPerMonth = reportingHours * 0.9 * 4;
  const efficiencyGain = 40;
  const annualTimeSavings = hoursSavedPerMonth * 12;
  const costPerHour = 20;
  const annualSavings = annualTimeSavings * costPerHour * employees;

  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calculator className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              ROI Calculator
            </h1>
            <p className="text-xl text-gray-600">
              Calculate your potential return on investment with TradeFlow ERP. 
              See how much time and money you could save.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Enter Your Business Details
              </h2>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    value={employees}
                    onChange={(e) => setEmployees(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Hours Spent on Manual Reporting per Week
                  </label>
                  <input
                    type="number"
                    value={reportingHours}
                    onChange={(e) => setReportingHours(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average Monthly Revenue (PKR)
                  </label>
                  <input
                    type="number"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <Button onClick={calculate} className="w-full" size="lg">
                Calculate ROI
              </Button>
            </div>

            {showResults && (
              <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Your Estimated Savings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <p className="text-blue-100 text-sm mb-2">Hours Saved Per Month</p>
                    <p className="text-3xl font-bold">{hoursSavedPerMonth.toFixed(1)} hours</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <p className="text-blue-100 text-sm mb-2">Estimated Efficiency Gain</p>
                    <p className="text-3xl font-bold">{efficiencyGain}%</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <p className="text-blue-100 text-sm mb-2">Annual Time Savings</p>
                    <p className="text-3xl font-bold">{annualTimeSavings.toFixed(0)} hours</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <p className="text-blue-100 text-sm mb-2">Estimated Annual Savings</p>
                    <p className="text-3xl font-bold">PKR {annualSavings.toLocaleString()}</p>
                  </div>
                </div>

                <p className="text-center text-blue-100 mt-6 text-sm">
                  * Estimates based on industry averages and may vary based on your specific use case.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
