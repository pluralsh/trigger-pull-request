import * as core from "@actions/core";
import * as path from "path";

const createPrMutation = `
mutation CreatePullRequest($identifier: String, $branch: String!, $name: String!, $context: Json!) {
  createPullRequest(identifier: $identifier, branch: $branch, name: $name, context: $context) {
    id
    url
  }
}
`

const getPrQuery = `
query GetPullRequest($id: ID!) {
  pullRequest(id: $id) {
    id
    status
  }
}
`

const POLL_INTERVAL_MS = 10000; // 10 seconds

async function main() {
    const url = core.getInput('url');
    const token = core.getInput('token');
    const prAutomation = core.getInput('prAutomation');
    const branch = core.getInput('branch');
    const poll = core.getInput('poll') === 'true';
    let identifier = core.getInput('identifier');
    let context = core.getInput('context');

    if (!context) {
        context = '{}';
    }

    if (!identifier) {
        identifier = null
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
            query: createPrMutation, 
            variables: { identifier, branch, context, name: prAutomation } 
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        core.setFailed(`Failed to create pull request: ${response.status}\n${body}`);
        return;
    }

    const resp = await response.json();
    const pr = resp.data?.createPullRequest;

    if (!pr) {
        core.setFailed(`Failed to create pull request: ${JSON.stringify(resp.errors)}`);
        return;
    }

    core.info(`Created pull request: ${pr.url}!  Go to the given URL to review and approve your PR.`);

    if (poll) {
        core.info('Polling for PR to be merged...');
        await pollUntilMerged(url, token, pr.id);
    }
}

async function pollUntilMerged(url, token, prId) {
    while (true) {
        const response = await fetch(path.join(url, 'gql'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: getPrQuery,
                variables: { id: prId }
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            core.setFailed(`Failed to poll pull request status: ${response.status}\n${body}`);
            return;
        }

        const resp = await response.json();
        const pr = resp.data?.pullRequest;

        if (!pr) {
            core.setFailed(`Failed to get pull request: ${JSON.stringify(resp.errors)}`);
            return;
        }

        const status = pr.status?.toUpperCase();
        core.info(`PR status: ${status}`);

        if (status === 'MERGED') {
            core.info('PR has been merged!');
            return;
        }

        if (status === 'CLOSED') {
            core.setFailed('PR was closed without being merged');
            return;
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
}

main();