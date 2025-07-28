# Users Module

## Description

The Users module is responsible for managing user data in the application. It provides CRUD operations for users and SENCE users.

## Functionality

- **User Management:** Provides CRUD operations for users, including creating, reading, updating, and deleting users.
- **SENCE User Management:** Provides CRUD operations for SENCE users.
- **User Profile:** Allows users to view and update their own profile.
- **Password Management:** Allows users to change their password.
- **Permission Management:** Allows administrators to assign roles and permissions to users.

## Relationship with other modules

- **Auth Module:** The Users module is tightly coupled with the Auth module. The `Usuario` model is used to store user information, including their role, which is used by the Auth module for authentication and authorization.
- **SENCE Module:** The Users module is related to the SENCE module, as it manages SENCE users.
- **All other modules:** The Users module is related to all other modules that have user-specific data. For example, the Projects module has a relationship with the Users module to assign a project to a user.
