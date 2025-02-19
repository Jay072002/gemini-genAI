# Install node modules
npm i

# Generate API key from gemini studio
https://aistudio.google.com/

# Create .env file and add this keys 
DB_CONNECTION=
DB_HOST=
DB_PORT=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
ACCESS_TOKEN_SECRET=
API_KEY=

# Pre-requisite 

Pgvector extention should be installed and configured

# Pgvector clone repository
git clone https://github.com/pgvector/pgvector.git

# Open cmd tool and navigate to pgvector directory and run this commands
msbuild pgvector.vcxproj

if any error occurs while running above command make sure to download msbuild tool from https://visualstudio.microsoft.com/visual-cpp-build-tools/ below are the steps to download it

For windows download build tools 
https://visualstudio.microsoft.com/visual-cpp-build-tools/
And select Desktop development with C++ (Helps to run commands like nmake to generate build (nmake a build tool for microsoft))

# Add the path to system environment variable
C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin
change path according to your msbuild installed directory


1. After installing try building the pgvector using 
msbuild pgvector.vcxproj

2. Set the PGROOT Environment Variable
set PGROOT="C:\Program Files\PostgreSQL\15"
If using PowerShell, prefix with $env::
$env:PGROOT="C:\Program Files\PostgreSQL\15"

3. Then, Run the Build Command Again
nmake -f Makefile.win
nmake /F Makefile.win install


# Below is the standard step to install and configure and the dll files are automatically copied to postgres lib and share folder 

vector.control
vector.dll
and all files from sql vector--*.*.*--*.*.* 


move vector.dll file to postgres lib folder if not present

move all scl file to share folder if not present


To install the pgvector extension for PostgreSQL on a Windows system, follow the steps below. This guide assumes you have PostgreSQL installed and provides detailed instructions for setting up the necessary build environment using Microsoft Visual Studio.

Prerequisites
PostgreSQL Installation: Ensure PostgreSQL is installed on your system. You can download it from the official PostgreSQL website.

Git Installation: Install Git for Windows from the official Git website.

Microsoft Visual Studio with C++ Build Tools: pgvector requires C++ support to build the extension.

Download Visual Studio: Obtain the Visual Studio Installer.

Install C++ Build Tools:

Launch the Visual Studio Installer.
Select "Modify" for your installed version of Visual Studio.
In the Workloads tab, check "Desktop development with C++".
Click "Modify" to install the selected components.
Building and Installing pgvector
Open Developer Command Prompt: After installing Visual Studio, open the Developer Command Prompt for Visual Studio with administrative privileges. This sets up the environment variables required for building C++ applications.

Set the PostgreSQL Installation Path: Define the PGROOT environment variable to point to your PostgreSQL installation directory. Replace X with your PostgreSQL version number.

set "PGROOT=C:\Program Files\PostgreSQL\X"
Clone the pgvector Repository: Navigate to a temporary directory and clone the pgvector source code.

cd %TEMP%
git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
cd pgvector
Build and Install the Extension: Use nmake (the build tool provided by Visual Studio) to compile and install pgvector.

nmake /F Makefile.win
nmake /F Makefile.win install
If you encounter errors indicating that nmake is not recognized, ensure you're using the Developer Command Prompt provided by Visual Studio, which includes nmake in its environment.

Enabling the pgvector Extension in PostgreSQL
Restart PostgreSQL Service: After installing the extension, restart the PostgreSQL service to recognize the new extension.

Create the Extension in Your Database: Connect to your PostgreSQL database using psql or another client, and run:

CREATE EXTENSION vector;
This command enables the pgvector extension for your database.

Verification
To confirm that pgvector is installed correctly:

Check Available Extensions: Run the following query in your PostgreSQL client:

SELECT * FROM pg_available_extensions WHERE name = 'vector';
If installed correctly, the vector extension will be listed with its version and description.

Test Functionality: Create a table with a vector column and perform basic operations to ensure the extension works as expected.

CREATE TABLE items (id SERIAL PRIMARY KEY, embedding VECTOR(3));
INSERT INTO items (embedding) VALUES ('[1, 2, 3]'), ('[4, 5, 6]');
SELECT * FROM items ORDER BY embedding <-> '[3, 1, 2]' LIMIT 5;
This sequence creates a table, inserts sample vectors, and queries for the nearest neighbors based on L2 distance.

By following these steps, you can successfully install and configure the pgvector extension on a Windows system, enabling vector similarity search capabilities within PostgreSQL.

