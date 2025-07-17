import java.util.Scanner;

public class ScoreTracker {
    public static void main(String[] args) {
        // Create a Scanner object to read input from the user
        Scanner scanner = new Scanner(System.in);
        
        // Define the number of players
        System.out.print("Enter the number of players: ");
        int numberOfPlayers = scanner.nextInt();
        
        // Create an array to hold the player names
        String[] playerNames = new String[numberOfPlayers];
        // Create an array to hold the player scores
        int[] playerScores = new int[numberOfPlayers];
        
        // Get player names
        for (int i = 0; i < numberOfPlayers; i++) {
            System.out.print("Enter the name of player " + (i + 1) + ": ");
            playerNames[i] = scanner.next();
            // Initialize their score to 0
            playerScores[i] = 0;
        }
        
        // Variable to control the game loop
        boolean gameRunning = true;
        
        // Game loop
        while (gameRunning) {
            // Display current scores
            System.out.println("\nCurrent Scores:");
            for (int i = 0; i < numberOfPlayers; i++) {
                System.out.println(playerNames[i] + ": " + playerScores[i]);
            }
            
            // Ask for player to score points
            System.out.print("Enter the player number to score points (1 to " + numberOfPlayers + ") or 0 to exit: ");
            int playerNumber = scanner.nextInt();
            
            // Check if the user wants to exit
            if (playerNumber == 0) {
                gameRunning = false; // Exit the game loop
                continue; // Skip the rest of the loop
            }
            
            // Validate player number
            if (playerNumber < 1 || playerNumber > numberOfPlayers) {
                System.out.println("Invalid player number. Please try again.");
                continue; // Skip to the next iteration of the loop
            }
            
            // Ask for points to add
            System.out.print("Enter points to add for " + playerNames[playerNumber - 1] + ": ");
            int points = scanner.nextInt();
            
            // Update the player's score
            playerScores[playerNumber - 1] += points;
        }
        
        // Display final scores when the game ends
        System.out.println("\nFinal Scores:");
        for (int i = 0; i < numberOfPlayers; i++) {
            System.out.println(playerNames[i] + ": " + playerScores[i]);
        }
        
        // Close the scanner
        scanner.close();
    }
}