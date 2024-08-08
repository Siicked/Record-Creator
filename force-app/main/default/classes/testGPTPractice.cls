public class AccountBatchUpdater {
    public static void updateAccountNames(List<Id> accountIds, String newName) {
        if (accountIds == null || accountIds.isEmpty()) {
            throw new IllegalArgumentException('Account IDs cannot be null or empty.');
        }

        List<Account> accountsToUpdate = [SELECT Id, Name FROM Account WHERE Id IN :accountIds];

        if (accountsToUpdate.isEmpty()) {
            System.debug('No accounts found with the provided IDs.');
            return;
        }

        for (Account acc : accountsToUpdate) {
            if (acc.Name != newName) {
                acc.Name = newName;
            }
        }

        try {
            if (!accountsToUpdate.isEmpty()) {
                update accountsToUpdate;
            }
        } catch (DmlException e) {
            System.debug('Error occurred while updating accounts: ' + e.getMessage());
            // Add more detailed error handling as needed
        }
    }
}
