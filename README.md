# trigger-pull-request Github Action

Github Action to call a Plural PR Automation.  Commonly used to trigger PRs after docker image builds or other CI-native processes that need to be bridged to a GitOps workflow.  The action itself is a very thin js wrapper over the gql api call for your Plural Console instance.

## Inputs

```yaml
url:
  description: the url of your Plural Console instance
  required: true
token:
  description: the token to use to authenticate with Plural Console
  required: true
prAutomation:
  description: the name of the PR automation to trigger
  required: true
branch:
  description: the branch to create the PR on
  required: true
identifier:
  description: the repository identifier slug to use to create the PR, eg "plural/console"
  required: false
context:
  description: the context to use to create the PR.  This must be correctly JSON encoded.
  required: false
```

## Example Usage

```
- name: Authenticate
  id: plural
  uses: pluralsh/setup-plural@v2
  with:
    consoleUrl: https://my.console.cloud.plural.sh
    email: someone@example.com # the email bound to your OIDC federated credential
- name: Trigger PR
  uses: pluralsh/trigger-pull-request@v1
  with:
    url: https://my.console.cloud.plural.sh
    token: ${{ steps.plural.outputs.consoleToken }}
    identifier: pluralsh/plural
    branch: test-trigger-pr
    prAutomation: test-pr
    context: |
      {
        "input": "some-input"
      }
```
    

