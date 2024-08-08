    @isTest
public class AccountBatchUpdaterTest {
    @TestSetup
    static void AccountBatchUpdaterTestDataCreate() {

        List<Account> testAccounts = new List<Account>();

        for (Integer i = 0; i < 10; i++) {
            testAccounts.add(new Account(Name = 'Test Account ' + i));
        }
        insert testAccounts;
    }
        @isTest
        static void testUpdateAccountNames() {
            // Recupera los IDs de las cuentas insertadas
            List<Account> accounts = [SELECT Id, Name FROM Account WHERE Name LIKE 'Test Account%'];
            List<Id> accountIds = new List<Id>();
            for (Account acc : accounts) {
                accountIds.add(acc.Id);
            }

            // Ejecuta el método a probar
        Test.startTest();
        AccountBatchUpdater.updateAccountNames(accountIds, 'Updated Account');
        Test.stopTest();

        List<Account> updatedAccounts = [SELECT Name FROM Account WHERE Id IN :accountIds];
        for (Account acc : updatedAccounts) {
            System.assertEquals('Updated Account', acc.Name, 'Account name was not updated correctly.');
        }
        }

        @isTest
    static void testEmptyAccountIds() {
        try {
            Test.startTest();
            AccountBatchUpdater.updateAccountNames(new List<Id>(), 'Updated Account');
            Test.stopTest();
            System.assert(false, 'Expected an exception for empty account IDs.');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('Account IDs cannot be null or empty.'));
        }
    }

    @isTest
    static void testNoAccountsFound() {
        List<Id> nonExistentIds = new List<Id>{'001000000000000AAA'};
        Test.startTest();
        AccountBatchUpdater.updateAccountNames(nonExistentIds, 'Updated Account');
        Test.stopTest();

        // Verifica que no se hayan realizado actualizaciones
        List<Account> accounts = [SELECT Name FROM Account WHERE Id IN :nonExistentIds];
        System.assertEquals(0, accounts.size(), 'No accounts should have been found.');
    }
    
    @isTest
    static void testDmlExceptionHandling() {
        // Crea una cuenta para la prueba
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        // Usar un método para simular una excepción de DML (por ejemplo, haciendo que la cuenta sea ilegible)
        Test.startTest();
        try {
            System.runAs(new User(Id = UserInfo.getUserId(), ProfileId = [SELECT Id FROM Profile WHERE Name='Standard User'].Id)) {
                AccountBatchUpdater.updateAccountNames(new List<Id>{acc.Id}, 'Updated Account');
                System.assert(false, 'Expected a DML exception.');
            }
        } catch (DmlException e) {
            System.assert(e.getMessage().contains('FIELD_CUSTOM_VALIDATION_EXCEPTION'), 'Unexpected exception message: ' + e.getMessage());
        }
        Test.stopTest();
    }
}

    