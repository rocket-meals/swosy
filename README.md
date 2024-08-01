# Rocket Meals

[![Expo Update](https://github.com/rocket-meals/rocket-meals/actions/workflows/frontend_native_expo.yml/badge.svg?branch=expo)](https://github.com/rocket-meals/rocket-meals/actions/workflows/frontend_native_expo.yml)

Web Demo: https://rocket-meals.github.io/rocket-meals/


Product home page: https://rocket-meals.de

# Kunden

Farben und Assets der Kunden können aus /customers/ entnommen werden.


# Requirements

- Node 18.18.0

# Update repository

IMPORTANT: Please read since this is a forked repository and updates are not as easy as usual. Not correctly done updates **will AFFECT the ORIGINAL repository**.

- Click on Sync Fork
  - If there is "Update fork" or so, click it, you are done
  - If there is "Open pull request" PLEASE READ!
      - Press open pull request
      - A message "There isn't anything to compare" shows. Thats wrong!
      - Click on top at "Comparing changes" and press "compare across forks"
      - Select the right side: "head repository" and select "rocket-meals/rocket-meals"
      - Now you should be able to press on "create pull request" BUT CONTINUE READING
      - Press "Create pull request and write a nice title.
      - Press "Open/Create pull request"
      - Press on "Resolve conflicts"
      - ATTENTION! Press on "Create a NEW BRANCH" instead commit updates into master branch.
          - This is important, otherwise the original repo "rocket-meals/rocket-meals" will also get the commit, which is unwanted.
      - After new branch is created, check on top if that is into "rocket-meals/<project>:master" and not "rocket-meals/rocket-meals:master"
      - Then merge and delete branch
      - Check if rocket-meals/rocket-meals has an unwanted commit.