public with sharing class CreateOppController {
    @AuraEnabled
    public static void oppCreator(String accountName, String oppName, Date closeDate, String stage) {

        if (String.isBlank(accountName)) {
            throw new AuraHandledException('El campo Account es obligatorio.');
        }
        if (String.isBlank(oppName)) {
            throw new AuraHandledException('El campo Opportunity Name es obligatorio.');
        }
        if (closeDate == null) {
            throw new AuraHandledException('El campo Close Date es obligatorio.');
        }
        
        Opportunity newOpp = new Opportunity();
        newOpp.AccountId = getAccountId(accountName);
        newOpp.Name = oppName;
        newOpp.CloseDate = closeDate;
        newOpp.StageName = stage;
        
        try {
            insert newOpp;
        } catch (DmlException e) {
            throw new AuraHandledException('Error al crear la oportunidad: ' + e.getMessage());
        }
    }

    private static Id getAccountId(String accountName) {
        List<Account> accounts = [SELECT Id FROM Account WHERE Name = :accountName LIMIT 1];
        if (accounts.isEmpty()) {
            throw new AuraHandledException('No se encontró ninguna cuenta con el nombre especificado: ' + accountName);
        }
        return accounts[0].Id;
    }
}
