"use server";

import prisma from "@/lib/db";

function generateProjectName(): string {
  const adjectives = [
    "Silly", "Giggly", "Wonky", "Funky", "Chunky", "Spicy", "Derpy", "Wobbly", 
    "Bouncy", "Zesty", "Fluffy", "Cranky", "Goofy", "Cheeky", "Sneaky", "Sassy", 
    "Dizzy", "Sleepy", "Hyper", "Jolly", "Clumsy", "Wacky", "Salty", "Greasy"
  ];

  const nouns = [
    "Potato", "Banana", "Wombat", "Monkey", "Panda", "Noodle", "Taco", "Donut", 
    "Muffin", "Pickle", "Penguin", "Koala", "Sloth", "Avocado", "Marshmallow", 
    "Waffle", "Nugget", "Cheeto", "Burrito", "Hamster", "Otter", "Capybara", "Chicken", "Pancake"
  ];

  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(10 + Math.random() * 90); // 10 to 99

  return `${randomAdj}${randomNoun}${randomNumber}`;
}

export const insertProject = async (
  userId: string,
  initalPrompt: string,
  name?: string,
) => {
  const projectName = name || generateProjectName();
  try {
    const newProject = await prisma.project.create({
      data: {
        name: projectName,
        initialPrompt: initalPrompt,
        context: "",
        userId: userId,
      },
    });
    return newProject;
  } catch (err) {
    console.log("Error inserting the data in Projects Table: ", err);
    return null;
  }
};

export const getProject = async (projectId: string) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    return project;
  } catch (err) {
    console.log("Error fetching project: ", err);
    return null;
  }
};

