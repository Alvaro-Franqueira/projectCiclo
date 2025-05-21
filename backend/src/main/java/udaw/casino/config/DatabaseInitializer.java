package udaw.casino.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Component responsible for initializing the database with initial game data
 * when the Spring Boot application starts.
 *
 * This class demonstrates two ways to achieve this:
 * 1. Using @PostConstruct: Executes after the bean is constructed and dependencies are injected.
 * 2. Using CommandLineRunner: Executes after the entire Spring application context has loaded.
 *
 * Choose one method and comment out the other.
 */
@Component
public class DatabaseInitializer implements CommandLineRunner { // Implements CommandLineRunner for option 2.2

    private final DataSource dataSource;

    /**
     * Constructor for dependency injection of the DataSource.
     * @param dataSource The DataSource provided by Spring Boot for database connection.
     */
    public DatabaseInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // --- Option 2.1: Using @PostConstruct ---
    // Uncomment this method and comment out the run method below if you prefer @PostConstruct.
    /*
    @PostConstruct
    public void initializeWithPostConstruct() {
        executeSqlScript("Post-Construct");
    }
    */

    // --- Option 2.2: Using CommandLineRunner ---
    // This method will be executed after the application context is fully loaded.
    @Override
    public void run(String... args) throws Exception {
        executeSqlScript("Command-Line Runner");
    }

    /**
     * Helper method to execute the SQL script.
     * It handles database connection, script execution, and error logging.
     *
     * @param callerMethod A string indicating which method called this (for logging purposes).
     */
    private void executeSqlScript(String callerMethod) {
        System.out.println("Attempting to execute initial game data script via " + callerMethod + "...");
        try (Connection connection = dataSource.getConnection()) {
            // Set auto-commit to false to ensure the transaction is managed by the SQL script itself.
            // The BEGIN TRANSACTION and COMMIT in the SQL script will control the transaction.
            connection.setAutoCommit(false);

            // Load the SQL script from the classpath resources.
            // This path is relative to the 'resources' folder, so 'sql/initial_game_data.sql' is correct.
            ClassPathResource resource = new ClassPathResource("sql/initial_game_data.sql");

            // Execute the SQL script. ScriptUtils handles splitting by semicolon.
            ScriptUtils.executeSqlScript(connection, resource);

            // Explicitly commit the transaction if the script completed without raising an exception.
            connection.commit();
            System.out.println("Initial game data script executed successfully via " + callerMethod + ".");

        } catch (SQLException e) {
            // Catch SQLException specifically to handle the RAISE EXCEPTION from PostgreSQL.
            // When RAISE EXCEPTION occurs in PostgreSQL within a transaction, it causes an implicit rollback.
            // The exception message will contain the text from RAISE EXCEPTION.
            System.err.println("Failed to execute initial game data script via " + callerMethod + " due to SQL error: " + e.getMessage());
            // No explicit rollback needed here as PostgreSQL handles it on exception.
        } catch (Exception e) {
            // Catch any other unexpected exceptions.
            System.err.println("An unexpected error occurred during database initialization via " + callerMethod + ": " + e.getMessage());
        }
    }
}
