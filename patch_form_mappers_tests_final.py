with open('tests/domain/form-mappers.test.ts', 'r') as f:
    content = f.read()

replacement = """  it('maps an explicitly set true or false camera describable state safely', () => {
    const draftTrue: PerspectiveDraftRecord = {
      ...baseDraft,
      content: {
        observation: { isCameraDescribable: true }
      }
    };
    expect(mapDraftToFormState(draftTrue).isCameraDescribable).toBe(true);

    const draftFalse: PerspectiveDraftRecord = {
      ...baseDraft,
      content: {
        observation: { isCameraDescribable: false }
      }
    };
    expect(mapDraftToFormState(draftFalse).isCameraDescribable).toBe(false);

    const draftTextNoState: PerspectiveDraftRecord = {
      ...baseDraft,
      content: {
        observation: { text: "Das Kind läuft" }
      }
    };
    expect(mapDraftToFormState(draftTextNoState).isCameraDescribable).toBeNull();
  });
});"""

content = content.replace('});', replacement, 1)

with open('tests/domain/form-mappers.test.ts', 'w') as f:
    f.write(content)
