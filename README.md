# TPA Manager extension

This project has been a extension and improved from original [TPA Manager](https://github.com/MaToSan24/TPA-Manager).

TPA Manager is a web application that allows users to navigate through their scope, in order to manage courses, Team Practices Agreements (TPAs), and TPA templates. It has been developed using Vue.js 3, Vite, and PrimeVue.

## Table of contents

- [Project setup](#project-setup)
- [Documentation](#documentation)
  - [Vue.js 3](#vuejs-3)
  - [Vite](#vite)
  - [PrimeVue](#primevue)
  - [SimpleCodeEditor](#simplecodeeditor)
- [Governify specific configuration](#governify-specific-configuration)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)
- [Badges](#badges)


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run dev
```

### Compiles and minifies for production
```
npm run build
```

## Documentation

### Vue.js 3

The documentation for Vue.js 3 can be found under the following [link](https://vuejs.org/guide/introduction.html).

### Vite

The documentation for Vite can be found under the following [link](https://vitejs.dev/guide/).

### PrimeVue

The documentation for PrimeVue can be found under the following [link](https://primevue.org/).

### SimpleCodeEditor

The Code Editor component used for editing JSON, JavaScript and GraphQL is [SimpleCodeEditor](https://github.com/justcaliturner/simple-code-editor) and its documentation can be found under the following [link](https://simple-code-editor.vicuxd.com/).

## Governify specific configuration

This application has been developed to be used within the Governify framework. In order to do so, some Governify-specific tool like ***Bluejay*** must be deployed in the same server as the TPA Manager.

The following table shows the tools that must be deployed and the corresponding environment variables that must be set in the TPA Manager.

| Tool | Environment variable  | Default value | Example value |
| ---- | --------------------- | ------------- | ------------- |
| TPA Manager | - |  http://localhost:5173 | https://tpa-manager.bluejay.governify.io |
| ASSETS_MANAGER_URL | process.env.ASSETS_MANAGER_URL | http://localhost:5200 | https://assets.bluejay.governify.io/ |
| REGISTRY_URL | process.env.REGISTRY_URL | http://localhost:5400 | https://registry.bluejay.governify.io/ |
| SCOPE_MANAGER_URL | process.env.SCOPE_MANAGER_URL | http://localhost:5700 | https://scopes.bluejay.governify.io |
| COLLECTOR_EVENTS_URL | process.env.COLLECTOR_EVENTS_URL | http://localhost:5500 | https://event-collector.bluejay.governify.io/ |
| DASHBOARD_URL | process.env.DASHBOARD_URL | http://localhost:5600 | https://dashboard.bluejay.governify.io/ |
| REPORTER | process.env.REPORTER_URL | http://localhost:5300 | https://reporter.bluejay.governify.io/ |




To set the environment variables:

1. Create a `.env` file in the root directory of the project and set the variables there. The file should look like this (the values are just examples):

```
ASSETS_MANAGER_URL=https://assets.bluejay.governify.io/
REGISTRY_URL=https://registry.bluejay.governify.io/
SCOPE_MANAGER_URL=https://scopes.bluejay.governify.io
COLLECTOR_EVENTS_URL=https://event-collector.bluejay.governify.io/
DASHBOARD_URL=https://dashboard.bluejay.governify.io/
REPORTER_URL=https://reporter.bluejay.governify.io/
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Authors

* **Jorge Florentino Serra** - [jorgefl8](https://github.com/jorgefl8)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Badges

[![DeepScan grade](https://deepscan.io/api/teams/24171/projects/27402/branches/875329/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=24171&pid=27402&bid=875329)
