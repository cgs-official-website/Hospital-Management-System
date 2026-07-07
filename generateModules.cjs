const fs = require('fs');
const path = require('path');

const modules = {
  superadmin: [
    'VendorOnboarding', 'SubscriptionBilling', 'MultiTenantConfig', 'ModuleToggle',
    'GlobalRoleManagement', 'PaymentGateway', 'VendorUsage', 'GlobalAnalytics',
    'SupportTicket', 'NotificationTemplates', 'AuditLogs', 'CMSLandingPage', 'APIIntegration'
  ],
  admin: [
    'HospitalProfile', 'AppointmentScheduling', 'IPDManagement', 'LabTestManagement',
    'HospitalBilling', 'DutyRoster', 'HospitalReports', 'Telemedicine'
  ],
  nurse: [
    'VitalsMonitoring', 'ADTManagement', 'BedWardManagement', 'MARManagement',
    'NurseNotes', 'ShiftTaskManagement', 'DoctorOrderTracking'
  ],
  pharmacist: [
    'PurchaseOrderManagement', 'PrescriptionDispensing', 'StockAlerts',
    'MedicineBilling', 'StockAdjustment', 'BarcodeScanning', 'PharmacyReports'
  ],
  receptionist: [
    'PaymentCollection', 'InsuranceClaim', 'PatientLookup', 'VisitorManagement'
  ],
  shared: [
    'SettingsConfiguration'
  ]
};

const getRelativePath = (role) => {
    return role === 'shared' ? '../components/PlaceholderModule' : '../../shared/components/PlaceholderModule';
};

for (const [role, mods] of Object.entries(modules)) {
  const dir = path.join(__dirname, 'src', 'features', role);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const mod of mods) {
    const file = path.join(dir, `${mod}.jsx`);
    if (!fs.existsSync(file)) {
      const content = `import React from 'react';
import PlaceholderModule from '${getRelativePath(role)}';

const ${mod} = () => {
  return (
    <PlaceholderModule 
      title="${mod.replace(/([A-Z])/g, ' $1').trim()}" 
      description="This module is part of the ZUNA Enterprise Architecture and is currently pending activation."
    />
  );
};

export default ${mod};
`;
      fs.writeFileSync(file, content);
      console.log(`Created ${file}`);
    }
  }
}
