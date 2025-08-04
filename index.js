import * as core from "@actions/core";
import * as path from "path";

const gqlDoc = `
mutation CreatePullRequest($identifier: String, $branch: String!, $name: String!, $context: Json!) {
  createPullRequest(identifier: $identifier, branch: $branch, name: $name, context: $context) {
    url
  }
}
`

async function main() {
    const url = core.getInput('url');
    const token = core.getInput('token');
    const prAutomation = core.getInput('prAutomation');
    const branch = core.getInput('branch');
    const identifier = core.getInput('identifier');
    let context = core.getInput('context');

    if (!context) {
        context = '{}';
    }

    try {
        JSON.parse(context);
    } catch (e) {
        core.setFailed(`context must be a valid JSON object, got: ${context}`);
        return;
    }

    const response = await fetch(path.join(url, 'gql'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
            query: gqlDoc, 
            variables: { identifier, branch, context, name: prAutomation } 
        }),
    });

    if (!response.ok) {
        core.setFailed(`Failed to create pull request: ${response.status} ${response.statusText}`);
        return;
    }

    const resp = await response.json();
    const pr = resp.data?.createPullRequest;

    if (!pr) {
        core.setFailed(`Failed to create pull request: ${JSON.stringify(resp.errors)}`);
        return;
    }
    core.info(`Created pull request: ${pr.url}!  Go to the given URL to review and approve your PR.`);
}

main();