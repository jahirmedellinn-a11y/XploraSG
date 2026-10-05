const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  approvalRequirements,
  parseReviewContentKind,
  parseReviewState,
} = require('../dist/services/contentReviewService');

const complete = {
  has_description: true,
  has_location: true,
  has_source: true,
  has_contact: true,
  has_provider: true,
  has_public_media: true,
};

test('valida tipos y estados editoriales permitidos', () => {
  assert.equal(parseReviewContentKind('lugar'), 'lugar');
  assert.equal(parseReviewContentKind('prestador'), null);
  assert.equal(parseReviewState('en_revision'), 'en_revision');
  assert.equal(parseReviewState('publicado'), null);
});

test('impide aprobar lugares sin coordenadas ni multimedia pública', () => {
  const missing = approvalRequirements('lugar', {
    ...complete,
    has_location: false,
    has_public_media: false,
  });
  assert.deepEqual(missing, ['coordenadas verificadas', 'multimedia pública autorizada']);
});

test('exige contacto y prestador para publicar servicios', () => {
  const missing = approvalRequirements('servicio', {
    ...complete,
    has_contact: false,
    has_provider: false,
  });
  assert.deepEqual(missing, ['contacto público', 'prestador identificado']);
});
