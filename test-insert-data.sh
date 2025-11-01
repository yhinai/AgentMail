#!/bin/bash
# Script to test all Convex tables by inserting data
# This uses the existing Convex functions

echo "Testing Convex Tables - Inserting Sample Data"
echo "=============================================="
echo ""

# Wait for Convex to detect the new testData file
echo "Waiting for Convex to detect testData.ts..."
sleep 5

# Try running the test function
echo "Running testData:insertAllTestData..."
npx convex run testData:insertAllTestData

if [ $? -ne 0 ]; then
    echo ""
    echo "Note: If the function is not found, Convex dev may still be compiling."
    echo "Please wait a moment and try again, or check convex dev logs."
    echo ""
    echo "Alternative: Test each table individually using existing functions:"
    echo ""
    echo "Test opportunities table:"
    echo "  npx convex run listings:storeScrapedItem --args '{\"externalId\":\"test-001\",\"title\":\"Test\",\"category\":\"Test\",\"platform\":\"Test\",\"url\":\"https://test.com\",\"listingPrice\":100,\"images\":[],\"seller\":{\"id\":\"test\",\"platform\":\"test\"},\"profitScore\":50}'"
fi

