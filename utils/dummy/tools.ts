import { execSync } from 'child_process';
import { Type, type FunctionDeclaration } from "@google/genai";
import fs from "fs"

export const bashTool = (command: string) => {
  try {
    const result = execSync(command, {
      encoding: "utf-8",
      stdio: "pipe"
    });
    return {
      type: "result",
      content: result
    };
  } catch (error) {
    return {
      type: "error",
      content: error instanceof Error ? error.message : String(error)
    };
  }
}


export const readFile =  ( path: string) => {
  try {
    return fs.readFileSync(path, 'utf-8');
  } catch (err: any) {
    throw new Error(`Failed to read file at ${path}: ${err.message}`);
  }
};



export const writeFile =  (
  path: string,
  fileContents: string,
) => {
  try {
    fs.writeFileSync(path, fileContents);
  } catch (err: any) {
    throw new Error(`Failed to write file at ${path}: ${err.message}`);
  }
};




export const bashToolSchema = {
    name: "run_bash_command",
    description:
    "Executes a bash/shell command inside the project directory on the host machine.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: {
                type: Type.STRING,
                description:
                    'The exact shell command to run (e.g. dir, node -e "...", tsc, etc.)',
            },
        },
        required: ["command"]
    }
}


export const readFileSchema = {
    name: "read_file",
    description:
    "Reads a file inside the project directory on the host machine.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            path: {
                type: Type.STRING,
                description:
                    'The exact path to the file to read',
            },
        },
        required: ["path"]
    }
}

export const writeFileSchema = {
    name: "write_file",
    description:
    "Writes a file inside the project directory on the host machine.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            path: {
                type: Type.STRING,
                description:
                    'The exact path to the file to write',
            },
            fileContents: {
                type: Type.STRING,
                description:
                    'The contents of the file to write',
            },
        },
        required: ["path", "fileContents"]
    }
}
