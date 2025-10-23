/**
 * Portal Configuration Module
 * This file defines the configuration structure for each portal
 * Admin can easily enable/disable modules and customize settings
 */

module.exports = {
  // Client Portal Configuration
  client: {
    enabled: true,
    modules: {
      needsRequest: {
        enabled: true,
        categories: ['food', 'shelter', 'medical', 'mental-health', 'addiction', 'clothing', 'legal', 'employment'],
        urgencyLevels: ['low', 'medium', 'high', 'critical'],
        allowAnonymous: true
      },
      serviceDirectory: {
        enabled: true,
        searchEnabled: true,
        mapIntegration: false // Future addon
      },
      communication: {
        enabled: true,
        chat: true,
        messaging: true,
        voiceCall: false, // Future addon
        videoCall: false  // Future addon
      },
      profile: {
        enabled: true,
        allowPhotoUpload: true,
        privacyControls: true
      },
      appointments: {
        enabled: true,
        allowRescheduling: true,
        reminderNotifications: true
      },
      resources: {
        enabled: true,
        educationalContent: true,
        crisisHotlines: true
      }
    },
    permissions: {
      canViewOwnData: true,
      canEditProfile: true,
      canDeleteAccount: true,
      canRequestServices: true
    }
  },

  // Outreach Staff Portal Configuration
  outreach: {
    enabled: true,
    modules: {
      clientManagement: {
        enabled: true,
        viewAllClients: true,
        assignClients: true,
        caseNotes: true,
        activityLog: true
      },
      needsResponse: {
        enabled: true,
        canAcceptNeeds: true,
        canForwardToProviders: true,
        priorityFiltering: true
      },
      scheduling: {
        enabled: true,
        fieldVisits: true,
        officeAppointments: true,
        teamCalendar: true
      },
      communication: {
        enabled: true,
        clientMessaging: true,
        providerMessaging: true,
        teamChat: true,
        bulkMessaging: false // Future addon
      },
      reporting: {
        enabled: true,
        dailyReports: true,
        outcomesTracking: true,
        statsVisualization: false // Future addon
      },
      resources: {
        enabled: true,
        serviceProviderDirectory: true,
        referralTracking: true
      }
    },
    permissions: {
      canViewClientData: true,
      canEditClientData: true,
      canCreateNeedsOnBehalf: true,
      canAccessReports: true,
      canManageOwnSchedule: true
    }
  },

  // Service Provider Portal Configuration
  provider: {
    enabled: true,
    modules: {
      serviceManagement: {
        enabled: true,
        listServices: true,
        availability: true,
        capacityTracking: true,
        waitlistManagement: false // Future addon
      },
      requestInbox: {
        enabled: true,
        acceptRequests: true,
        declineRequests: true,
        forwardRequests: true,
        priorityQueue: true
      },
      clientInteraction: {
        enabled: true,
        messaging: true,
        appointmentScheduling: true,
        followUpReminders: true
      },
      reporting: {
        enabled: true,
        serviceMetrics: true,
        clientOutcomes: true,
        feedbackCollection: false // Future addon
      },
      resources: {
        enabled: true,
        referralNetwork: true,
        bestPractices: true
      },
      billing: {
        enabled: false, // Future addon
        invoicing: false,
        paymentTracking: false
      }
    },
    permissions: {
      canViewAssignedClients: true,
      canUpdateServiceStatus: true,
      canCommunicateWithOutreach: true,
      canAccessAnalytics: true
    }
  },

  // Admin Portal Configuration
  admin: {
    enabled: true,
    modules: {
      userManagement: {
        enabled: true,
        createUsers: true,
        editUsers: true,
        deactivateUsers: true,
        roleManagement: true
      },
      portalConfiguration: {
        enabled: true,
        enableDisableModules: true,
        customizeSettings: true,
        themeCustomization: false // Future addon
      },
      systemMonitoring: {
        enabled: true,
        viewLogs: true,
        performanceMetrics: true,
        alertManagement: false // Future addon
      },
      dataManagement: {
        enabled: true,
        backupRestore: false, // Future addon
        dataExport: true,
        dataImport: true
      },
      reporting: {
        enabled: true,
        crossPortalAnalytics: true,
        customReports: true,
        scheduledReports: false // Future addon
      },
      contentManagement: {
        enabled: true,
        manageResources: true,
        announcements: true,
        helpContent: true
      }
    },
    permissions: {
      fullSystemAccess: true,
      canConfigurePortals: true,
      canManageAllUsers: true,
      canAccessAllData: true,
      canModifySettings: true
    }
  },

  // Global Settings
  global: {
    security: {
      sessionTimeout: 3600000, // 1 hour in ms
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireMFA: false // Future addon
    },
    notifications: {
      email: false, // Future addon
      sms: false,   // Future addon
      push: false,  // Future addon
      inApp: true
    },
    dataRetention: {
      clientDataYears: 7,
      logDataMonths: 12,
      anonymizeAfterInactive: 24 // months
    }
  }
};
