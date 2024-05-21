    public with sharing class createCase {
        
        @AuraEnabled
        public static void caseCreator(String accountName, String status, String priority, String origin, String subject, String type) {
            if (String.isBlank(accountName)) {
                throw new AuraHandledException('El campo Account es obligatorio.');
            }

            Case newCase = new Case();
            newCase.AccountId = getAccountId(accountName);
            newCase.Status = status;
            newCase.Priority = priority;
            newCase.Origin = origin;
            newCase.Subject = subject;
            newCase.Type = type;
            
            try {
                insert newCase;
            } catch (DmlException e) {
                throw new AuraHandledException('Error al crear el caso: ' + e.getMessage());
            }
        }
        
        private static Id getAccountId(String accountName) {
            Account acc = [SELECT Id FROM Account WHERE Name = :accountName LIMIT 1];
            return acc.Id;
        }
    }
