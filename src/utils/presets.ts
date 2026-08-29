import { PresetScenario, Currency } from '../types/calculator';

export function getPresets(currency: Currency): PresetScenario[] {
  const isINR = currency.code === 'INR';
  
  if (isINR) {
    return [
      {
        id: 'student-2bhk',
        name: 'Shared 2BHK',
        tag: 'Default Demo',
        description: '2 roommates sharing ₹20k rent + ₹4k utilities with ₹50k income',
        icon: 'GraduationCap',
        inputs: {
          rent: 20000,
          utilities: 4000,
          roommates: 2,
          income: 50000,
          affordabilityTarget: 30,
        }
      },
      {
        id: 'metro-solo-studio',
        name: 'Metro Solo 1RK',
        tag: 'Solo Living',
        description: 'Solo young professional in 1RK studio apartment',
        icon: 'User',
        inputs: {
          rent: 16000,
          utilities: 2500,
          roommates: 0,
          income: 60000,
          affordabilityTarget: 30,
        }
      },
      {
        id: 'tech-hub-3bhk',
        name: 'Tech Hub 3BHK',
        tag: 'High Split',
        description: '3 roommates in high-rise tech corridor flat',
        icon: 'Building2',
        inputs: {
          rent: 42000,
          utilities: 6000,
          roommates: 2,
          income: 85000,
          affordabilityTarget: 25,
        }
      },
      {
        id: 'budget-shared-room',
        name: 'Budget Twin-Sharing',
        tag: 'Max Savings',
        description: 'Cost-optimized twin room for college students',
        icon: 'PiggyBank',
        inputs: {
          rent: 12000,
          utilities: 2000,
          roommates: 3,
          income: 25000,
          affordabilityTarget: 35,
        }
      }
    ];
  }

  // Global presets for USD/EUR/GBP/etc.
  return [
    {
      id: 'shared-2bed',
      name: 'Shared 2-Bed',
      tag: 'Popular',
      description: '2 roommates sharing city apartment',
      icon: 'Building2',
      inputs: {
        rent: 1800,
        utilities: 300,
        roommates: 1,
        income: 4500,
        affordabilityTarget: 30,
      }
    },
    {
      id: 'solo-studio',
      name: 'Solo Studio',
      tag: 'Solo Living',
      description: 'Independent downtown studio living',
      icon: 'User',
      inputs: {
        rent: 1400,
        utilities: 200,
        roommates: 0,
        income: 5000,
        affordabilityTarget: 30,
      }
    },
    {
      id: 'student-house',
      name: '4-Bed Student House',
      tag: 'Max Savings',
      description: '4 university friends splitting a full house',
      icon: 'GraduationCap',
      inputs: {
        rent: 2800,
        utilities: 400,
        roommates: 3,
        income: 3000,
        affordabilityTarget: 35,
      }
    },
    {
      id: 'prime-condo',
      name: 'Prime City Flat',
      tag: 'Balanced',
      description: '3 young professionals in metro high-rise',
      icon: 'Home',
      inputs: {
        rent: 3300,
        utilities: 450,
        roommates: 2,
        income: 7000,
        affordabilityTarget: 28,
      }
    }
  ];
}
